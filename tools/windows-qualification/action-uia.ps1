# Run in a bounded, dedicated MTA client. The request identifies one owned window.
param(
 [Parameter(Mandatory)][string]$RequestPath,
 [Parameter(Mandatory)][string]$OutputPrefix
)
$ErrorActionPreference='Stop'
$result=[ordered]@{status='starting';apartment=[Threading.Thread]::CurrentThread.GetApartmentState().ToString();clientProcessId=$PID}
function Stage([string]$Name){[IO.File]::WriteAllText($OutputPrefix+'-stage.txt',$Name,[Text.UTF8Encoding]::new($false))}
function Unique-Elements($Elements){
 $seen=[System.Collections.Generic.HashSet[string]]::new()
 foreach($element in $Elements){
  $runtimeId=@($element.GetRuntimeId())
  if($runtimeId.Count -eq 0 -or $seen.Add(($runtimeId -join ','))){$element}
 }
}
try {
 if($result.apartment -ne 'MTA'){throw 'UIA action requires its dedicated MTA process'}
 $request=Get-Content $RequestPath -Raw|ConvertFrom-Json
 if($request.operation -notin @('focus','invoke','focused','select','point','field')){throw 'Unknown UIA action'}
 Stage 'window-owner'
 Add-Type @'
using System;
using System.Runtime.InteropServices;
public static class Core20ActionWindow {
 [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr window,out uint processId);
}
'@
 $handle=[IntPtr]::new([long]$request.windowHandle)
 $owner=[uint32]0
 $thread=[Core20ActionWindow]::GetWindowThreadProcessId($handle,[ref]$owner)
 if($handle -eq [IntPtr]::Zero -or $thread -eq 0 -or $owner -ne $request.expectedProcessId){throw 'Window is missing or belongs to another process'}
 Stage 'assembly'
 Add-Type -AssemblyName UIAutomationClient,UIAutomationTypes
 Stage 'from-handle'
 $root=[System.Windows.Automation.AutomationElement]::FromHandle($handle)
 if($root.Current.ProcessId -ne $request.expectedProcessId){throw 'UIA root belongs to another process'}
 $result.operation=$request.operation
 $result.rootProcessId=$root.Current.ProcessId
 Stage 'find-elements'
 if($request.operation -eq 'point'){
  $point=[System.Windows.Point]::new([double]$request.x,[double]$request.y)
  $hit=[System.Windows.Automation.AutomationElement]::FromPoint($point)
  if($null -eq $hit){throw 'UIA reported no element at the requested point'}
  $chain=@()
  $walker=[System.Windows.Automation.TreeWalker]::ControlViewWalker
  $node=$hit
  while($null -ne $node -and $chain.Count -lt 12){
   $bounds=$node.Current.BoundingRectangle
   $chain+=@{name=$node.Current.Name;type=$node.Current.ControlType.ProgrammaticName;className=$node.Current.ClassName;processId=$node.Current.ProcessId;x=$bounds.X;y=$bounds.Y;width=$bounds.Width;height=$bounds.Height}
   try{$node=$walker.GetParent($node)}catch{$node=$null}
  }
  $result.hitProcessId=$hit.Current.ProcessId
  $result.chain=$chain
 }elseif($request.operation -eq 'focused'){
  $condition=[System.Windows.Automation.PropertyCondition]::new([System.Windows.Automation.AutomationElement]::HasKeyboardFocusProperty,$true)
  $elements=$root.FindAll([System.Windows.Automation.TreeScope]::Descendants,$condition)
  Stage 'unique-focused-elements'
  $result.rawFocusedCount=$elements.Count
  $elements=@(Unique-Elements $elements)
  $result.uniqueFocusedCount=$elements.Count
  $focused=@()
  foreach($element in $elements){
   $focused+=@{name=$element.Current.Name;type=$element.Current.ControlType.ProgrammaticName;processId=$element.Current.ProcessId}
  }
  $result.focused=$focused
 }else{
  $fieldType=$request.operation -eq 'field'
  $allowed=@('ControlType.Button','ControlType.Hyperlink','ControlType.TabItem','ControlType.ListItem','ControlType.ComboBox','ControlType.MenuItem')
  if($request.operation -in @('field','focus')){$allowed+=@('ControlType.Edit','ControlType.Document')}
  if($request.controlType -notin $allowed){throw 'Unexpected action control type'}
  $condition=[System.Windows.Automation.PropertyCondition]::new([System.Windows.Automation.AutomationElement]::NameProperty,[string]$request.name)
  $elements=$root.FindAll([System.Windows.Automation.TreeScope]::Descendants,$condition)
  $matching=@($elements|Where-Object {$_.Current.ControlType.ProgrammaticName -ceq $request.controlType})
  Stage 'unique-name-matches'
  $result.rawMatchingCount=$matching.Count
  $matching=@(Unique-Elements $matching)
  $result.uniqueMatchingCount=$matching.Count
  if($matching.Count -ne 1){throw "Expected exactly one $($request.controlType) named $($request.name)"}
  $element=$matching[0]
  $result.target=@{name=$element.Current.Name;type=$element.Current.ControlType.ProgrammaticName;enabled=$element.Current.IsEnabled;focusable=$element.Current.IsKeyboardFocusable}
  Stage $request.operation
  try{
   if($request.operation -eq 'field'){
    $result.target.isPassword=$element.Current.IsPassword
    $result.target.className=$element.Current.ClassName
    try{
     $vp=[System.Windows.Automation.ValuePattern]$element.GetCurrentPattern([System.Windows.Automation.ValuePattern]::Pattern)
     $result.value=$vp.Current.Value
     $result.isReadOnly=$vp.Current.IsReadOnly
    }catch{$result.value=$null}
    try{
     $tp=[System.Windows.Automation.TextPattern]$element.GetCurrentPattern([System.Windows.Automation.TextPattern]::Pattern)
     $doc=$tp.DocumentRange
     $sel=$tp.GetSelection()
     $ranges=@()
     foreach($r in $sel){
      $head=$doc.Clone()
      $head.MoveEndpointByRange([System.Windows.Automation.Text.TextPatternRangeEndpoint]::End,$r,[System.Windows.Automation.Text.TextPatternRangeEndpoint]::Start)
      $start=$head.GetText(-1).Length
      $length=$r.GetText(-1).Length
      $ranges+=@{start=$start;length=$length}
     }
     $result.selection=$ranges
    }catch{$result.selection=$null}
   }elseif($request.operation -eq 'focus'){
    $element.SetFocus()
   }elseif($request.operation -eq 'select'){
    $pattern=[System.Windows.Automation.SelectionItemPattern]$element.GetCurrentPattern([System.Windows.Automation.SelectionItemPattern]::Pattern)
    $pattern.Select()
   }else{
    $pattern=[System.Windows.Automation.InvokePattern]$element.GetCurrentPattern([System.Windows.Automation.InvokePattern]::Pattern)
    $pattern.Invoke()
   }
  }catch{
   $cause=$_.Exception.GetBaseException()
   if($cause -isnot [System.Windows.Automation.ElementNotEnabledException] -and
      -not ($request.operation -eq 'focus' -and $cause -is [InvalidOperationException])){throw}
   $result.status='rejected'
   $result.rejectionType=$cause.GetType().FullName
   $result.rejection=$cause.Message
  }
  $result.targetFocused=$element.Current.HasKeyboardFocus
 }
 if($result.status -eq 'starting'){$result.status='completed'}
 Stage 'complete'
}catch{
 $result.status='failed'
 $result.error=$_.Exception.Message
}finally{
 $result|ConvertTo-Json -Depth 7|Set-Content ($OutputPrefix+'-result.json') -Encoding UTF8
}
if($result.status -eq 'failed'){exit 1}
