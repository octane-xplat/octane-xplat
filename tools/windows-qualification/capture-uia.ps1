# Run in a separate MTA process; the caller bounds its lifetime.
param(
 [Parameter(Mandatory)][long]$WindowHandle,
 [Parameter(Mandatory)][int]$ExpectedProcessId,
 [Parameter(Mandatory)][ValidateRange(0.1,10)][double]$Scale,
 [Parameter(Mandatory)][string]$OutputPrefix
)
$ErrorActionPreference='Stop'
$rows=[Collections.Generic.List[object]]::new()
$result=@{status='starting';apartment=[Threading.Thread]::CurrentThread.GetApartmentState().ToString();clientProcessId=$PID}
$previousDpi=[IntPtr]::Zero
function Stage([string]$Name){[IO.File]::WriteAllText($OutputPrefix+'-stage.txt',$Name,[Text.UTF8Encoding]::new($false))}
function Coordinate([double]$Value){
 if([double]::IsInfinity($Value) -or [double]::IsNaN($Value)){return $null}
 return $Value
}
try {
 if($result.apartment -ne 'MTA'){throw 'UIA capture requires its dedicated MTA process'}
 Stage 'before-window-owner'
 Add-Type @'
using System;
using System.Runtime.InteropServices;
public static class Core20UiaWindow {
 [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr window,out uint processId);
 [DllImport("user32.dll")] public static extern IntPtr SetThreadDpiAwarenessContext(IntPtr context);
}
'@
 $handle=[IntPtr]::new($WindowHandle)
 $owner=[uint32]0
 $thread=[Core20UiaWindow]::GetWindowThreadProcessId($handle,[ref]$owner)
 if($handle -eq [IntPtr]::Zero -or $thread -eq 0 -or $owner -ne $ExpectedProcessId){throw 'Window handle is missing or belongs to another process'}
 $previousDpi=[Core20UiaWindow]::SetThreadDpiAwarenessContext([IntPtr](-4))
 if($previousDpi -eq [IntPtr]::Zero){throw 'Cannot establish UIA client DPI awareness'}
 Stage 'before-assembly'
 Add-Type -AssemblyName UIAutomationClient,UIAutomationTypes
 Stage 'before-from-handle'
 $root=[System.Windows.Automation.AutomationElement]::FromHandle($handle)
 Stage 'before-root-process'
 $result.rootProcessId=$root.Current.ProcessId
 if($result.rootProcessId -ne $ExpectedProcessId){throw 'UIA root belongs to another process'}
 Stage 'before-root-name'
 $result.rootName=$root.Current.Name
 Stage 'before-find-all'
 $elements=$root.FindAll([System.Windows.Automation.TreeScope]::Descendants,[System.Windows.Automation.Condition]::TrueCondition)
 $result.elementCount=$elements.Count
 for($index=0;$index -lt $elements.Count;$index++){
  $element=$elements[$index]
  $row=[ordered]@{}
  Stage "element-$index-name"
  $row.name=$element.Current.Name
  Stage "element-$index-type"
  $row.type=$element.Current.ControlType.ProgrammaticName
  Stage "element-$index-id"
  $row.automationId=$element.Current.AutomationId
  Stage "element-$index-bounds"
  $bounds=$element.Current.BoundingRectangle
  $row.x=Coordinate $bounds.X
  $row.y=Coordinate $bounds.Y
  $row.width=Coordinate ($bounds.Width/$Scale)
  $row.height=Coordinate ($bounds.Height/$Scale)
  Stage "element-$index-enabled"
  $row.enabled=$element.Current.IsEnabled
  Stage "element-$index-focusable"
  $row.focusable=$element.Current.IsKeyboardFocusable
  Stage "element-$index-offscreen"
  $row.offscreen=$element.Current.IsOffscreen
  Stage "element-$index-patterns"
  $row.patterns=@($element.GetSupportedPatterns()|ForEach-Object {$_.ProgrammaticName})
  $rows.Add([pscustomobject]$row)
 }
 ConvertTo-Json -InputObject $rows.ToArray() -Depth 5|Set-Content ($OutputPrefix+'-rows.json') -Encoding UTF8
 Stage 'complete'
 $result.status='captured'
}catch{
 $result.status='failed'
 $result.error=$_.Exception.Message
}finally{
 if($previousDpi -ne [IntPtr]::Zero){[Core20UiaWindow]::SetThreadDpiAwarenessContext($previousDpi)|Out-Null}
 $result.rowsCaptured=$rows.Count
 $result|ConvertTo-Json -Depth 5|Set-Content ($OutputPrefix+'-result.json') -Encoding UTF8
}
if($result.status -ne 'captured'){exit 1}
