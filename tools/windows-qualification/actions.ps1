# Run in the signed-in Windows desktop session under the device/desktop-input lease.
# Action qualification driver. Fixture commands never activate controls or navigate to the target.
param(
 [Parameter(Mandatory)][ValidatePattern('^[a-f0-9]{40}$')][string]$ExpectedCommit,
 [Parameter(Mandatory)][version]$ExpectedPackageVersion,
 [Parameter(Mandatory)][string]$OutputDirectory,
 [switch]$AllowDirtyProbe,
 [switch]$DisplayActions,
 [ValidateSet('all','clickable-card','banner-action','banner-dismiss')][string]$DisplayActionCase='all',
 [switch]$ListItemActions,
 [switch]$TabActions,
 [switch]$SelectorActions
)
$ErrorActionPreference='Stop'
if(([int][bool]$DisplayActions + [int][bool]$ListItemActions + [int][bool]$TabActions + [int][bool]$SelectorActions) -gt 1){throw 'Choose one action mode per run'}
if($DisplayActionCase -ne 'all' -and -not $DisplayActions){throw 'DisplayActionCase requires DisplayActions'}
Add-Type @'
using System;
using System.Runtime.InteropServices;
public static class Core20Desktop {
 [StructLayout(LayoutKind.Sequential)] public struct Rect { public int Left,Top,Right,Bottom; }
 [StructLayout(LayoutKind.Sequential)] public struct MonitorInfo { public int Size; public Rect Monitor,Work; public uint Flags; }
 [DllImport("user32.dll")] public static extern IntPtr SetThreadDpiAwarenessContext(IntPtr value);
 [DllImport("user32.dll")] public static extern uint GetDpiForWindow(IntPtr window);
 [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr window,out uint processId);
 [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr window);
 [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr window,out Rect rect);
 [DllImport("user32.dll")] public static extern bool MoveWindow(IntPtr window,int x,int y,int width,int height,bool paint);
 [DllImport("user32.dll")] public static extern IntPtr MonitorFromWindow(IntPtr window,uint flags);
 [DllImport("user32.dll",CharSet=CharSet.Auto)] public static extern bool GetMonitorInfo(IntPtr monitor,ref MonitorInfo info);
 [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr window,int command);
}
'@
if(Test-Path $OutputDirectory){throw 'Use a new output directory so previous evidence is preserved'}
New-Item -ItemType Directory -Path $OutputDirectory | Out-Null
$pkg=@(Get-AppxPackage -Name org.octanexplat.windows61)
if($pkg.Count -ne 1 -or $pkg[0].Version -ne $ExpectedPackageVersion){throw 'Expected installed qualification MSIX version is missing'}
$pkg=$pkg[0]
$dataRoot=Join-Path (Join-Path $env:LOCALAPPDATA Packages) $pkg.PackageFamilyName
$script:LogPath=$null
$script:Boot=$null
$script:WindowHandle=[IntPtr]::Zero
$script:AppProcessId=0
$script:ReadCount=0
$script:Scale=1
$script:Checks=[Collections.Generic.List[object]]::new()
$script:Cases=[Collections.Generic.List[object]]::new()
$process=$null
$original=$null
$previousDpi=[Core20Desktop]::SetThreadDpiAwarenessContext([IntPtr](-4))
if($previousDpi -eq [IntPtr]::Zero){throw 'Cannot establish per-monitor DPI awareness'}
function Read-Events {
 if(-not $script:LogPath){return}
 $stream=$null
 $reader=$null
 try{
  # NativeScript keeps its log writer open while the app runs.
  $stream=[IO.FileStream]::new($script:LogPath,[IO.FileMode]::Open,[IO.FileAccess]::Read,([IO.FileShare]::ReadWrite -bor [IO.FileShare]::Delete))
  $reader=[IO.StreamReader]::new($stream,[Text.Encoding]::UTF8,$true)
  $lines=$reader.ReadToEnd() -split '\r?\n'
 }catch [IO.IOException]{return}
 finally{
  if($reader){$reader.Dispose()}
  if($stream){$stream.Dispose()}
 }
 # Callers already select this boot. Avoid reparsing older layout snapshots.
 $bootMarker=if($script:Boot){'"bootId":"'+$script:Boot.bootId+'"'}else{$null}
 foreach($line in $lines){
  if($bootMarker -and -not $line.Contains($bootMarker)){continue}
  $marker='[windows-core20] '
  $i=$line.IndexOf($marker)
  if($i -ge 0){try{$line.Substring($i+$marker.Length)|ConvertFrom-Json}catch{}}
 }
}
function Wait-For([scriptblock]$Condition,[string]$Failure,[int]$Seconds=12){
 $deadline=[DateTime]::UtcNow.AddSeconds($Seconds)
 do{if(& $Condition){return};Start-Sleep -Milliseconds 100}while([DateTime]::UtcNow -lt $deadline)
 throw $Failure
}
function Assert([bool]$Passed,[string]$Name,$Actual=$null){
 $script:Checks.Add([pscustomobject]@{name=$Name;passed=$Passed;actual=$Actual})
 if(-not $Passed){throw "Failed: $Name"}
}
function Near([double]$Actual,[double]$Expected){return [math]::Abs($Actual-$Expected) -le 1}
function Read-Tree {
 $script:ReadCount++
 $readDirectory=Join-Path $OutputDirectory ('uia-reads/'+$script:ReadCount.ToString('D4'))
 New-Item -ItemType Directory -Path $readDirectory -Force|Out-Null
 $prefix=Join-Path $readDirectory 'capture'
 $arguments=@('-NoProfile','-NonInteractive','-MTA','-ExecutionPolicy','Bypass','-File',('"'+$PSScriptRoot+'/capture-uia.ps1"'),'-WindowHandle',[string]$script:WindowHandle.ToInt64(),'-ExpectedProcessId',[string]$script:AppProcessId,'-Scale',$script:Scale.ToString([Globalization.CultureInfo]::InvariantCulture),'-OutputPrefix',('"'+$prefix+'"'))
 $client=Start-Process powershell.exe -ArgumentList $arguments -WindowStyle Hidden -PassThru -RedirectStandardOutput ($prefix+'-stdout.log') -RedirectStandardError ($prefix+'-stderr.log')
 try {
  $clientHandle=$client.Handle
  if(-not $client.WaitForExit(30000)){
   $stage=if(Test-Path ($prefix+'-stage.txt')){[IO.File]::ReadAllText($prefix+'-stage.txt')}else{'client startup'}
   throw "UIA client timed out at $stage; see $readDirectory"
  }
  if($null -eq $client.ExitCode -or $client.ExitCode -ne 0){throw "UIA client failed; see $readDirectory"}
  $result=Get-Content ($prefix+'-result.json') -Raw|ConvertFrom-Json
  if($result.status -ne 'captured' -or $result.rootProcessId -ne $script:AppProcessId){throw 'UIA capture identity or completion mismatch'}
  $nodes=Get-Content ($prefix+'-rows.json') -Raw|ConvertFrom-Json
  foreach($node in $nodes){$node}
 }finally{
  # A terminating UIA client can remain blocked on its provider.
  if(-not $client.HasExited){$client.Kill();$null=$client.WaitForExit(5000)}
  $client.Dispose()
 }
}
function Capture([string]$Stage){
 $previous=$null
 $deadline=[DateTime]::UtcNow.AddSeconds(12)
 do {
  $tree=@(Read-Tree)
  $serialized=$tree|ConvertTo-Json -Depth 5 -Compress
  if($null -ne $previous -and $serialized -ceq $previous){
   $tree|ConvertTo-Json -Depth 5|Set-Content (Join-Path $OutputDirectory "$Stage-uia.json") -Encoding UTF8
   return ,$tree
  }
  $previous=$serialized
  Start-Sleep -Milliseconds 100
 }while([DateTime]::UtcNow -lt $deadline)
 throw "UIA bounds did not settle for $Stage"
}
function Named($Tree,[string]$Name){
 $found=@($Tree|Where-Object {$_.name -ceq $Name})
 Assert ($found.Count -eq 1) "exactly one UIA node named $Name" $found.Count
 return $found[0]
}
function Finite($Node){
 foreach($value in @($Node.x,$Node.y,$Node.width,$Node.height)){
  if($null -eq $value -or [double]::IsNaN($value) -or [double]::IsInfinity($value)){return $false}
 }
 return -not ($Node.offscreen -or $Node.width -le 0 -or $Node.height -le 0)
}
function Command([string]$Action,$Value){
 $sequence=[guid]::NewGuid().ToString('N')
 $command=@{sequence=$sequence;action=$Action;value=$Value}|ConvertTo-Json -Compress
 [IO.File]::WriteAllText($script:Boot.commandPath,$command,[Text.UTF8Encoding]::new($false))
 Wait-For { @(Read-Events|Where-Object {$_.bootId -eq $script:Boot.bootId -and $_.event -eq 'command' -and $_.sequence -eq $sequence}).Count -eq 1 } "No acknowledgement for $Action"
 return $sequence
}
function Status-Contains([string]$Text){
 $renderErrors=@(Read-Events|Where-Object {$_.bootId -eq $script:Boot.bootId -and $_.event -eq 'render-error'})
 if($renderErrors.Count){throw ('Action render error: '+$renderErrors[-1].message)}
 Wait-For { @(Read-Tree|Where-Object {$_.name.StartsWith('Core20 ') -and $_.name.Contains($Text)}).Count -eq 1 } "UIA status never reached $Text"
}
function Snapshot([string]$Stage){
 $sequence=Command 'snapshot' $null
 $snapshotEvents=@(Read-Events|Where-Object {$_.bootId -eq $script:Boot.bootId -and $_.event -eq 'layout' -and $_.sequence -eq $sequence})
 Assert ($snapshotEvents.Count -eq 1) 'one native geometry response' $snapshotEvents.Count
 $snapshotEvents[0]|ConvertTo-Json -Depth 8|Set-Content (Join-Path $OutputDirectory "$Stage-native.json") -Encoding UTF8
 return ,@($snapshotEvents[0].nodes)
}
function Native-Id($Nodes,[string]$Id){
 $found=@($Nodes|Where-Object {$_.id -ceq $Id})
 Assert ($found.Count -eq 1) "one native node $Id" $found.Count
 return $found[0]
}
function Native-Text($Nodes,[string]$Text){
 $found=@($Nodes|Where-Object {$_.text -ceq $Text})
 Assert ($found.Count -eq 1) "one native label $Text" $found.Count
 return $found[0]
}
function Native-Class($Nodes,[string]$Name){
 $found=@($Nodes|Where-Object {$_.className -match [regex]::Escape($Name)})
 Assert ($found.Count -eq 1) "one native fixture node $Name" $found.Count
 return $found[0]
}
function Check-Reflow([string]$Case,$Tree,$Nodes){
 if($Case -eq 'text'){
  $text=Named $Tree 'Shared typography should wrap within the available space.'
  Assert (($text.type -eq 'ControlType.Text') -and (Finite $text) -and $text.width -lt 220) 'Resized Text remains a visible text peer below its width cap' $text.width
  return
 }
 $labels=@{vstack='Vertical';hstack='Horizontal';stack='Stack';view='View';center='Center';section='Section'}
 $group=Named $Tree ($labels[$Case]+' 0')
 Assert ($group.type -eq 'ControlType.Group' -and (Finite $group)) 'Resized component retains its named visible group'
 $root=Native-Id $Nodes "core20-$Case"
 switch($Case){
  {$_ -in @('vstack','hstack','stack')} {
   $first=Named $Tree ($labels[$Case]+' first')
   $second=Named $Tree ($labels[$Case]+' second')
   Assert ((Finite $first) -and (Finite $second)) 'Resized stack children remain visible'
   Assert ((Near (($second.y-$first.y)/$script:Scale-$first.height) 8) -and (Near $first.x $second.x)) 'Narrow stack has ordered vertical children and an 8-DIP gap'
   $child=Native-Text $Nodes ($labels[$Case]+' first')
   Assert ((Near ($child.box.x-$root.box.x) 8) -and (Near ($child.box.y-$root.box.y) 8)) 'Resized stack preserves 8-DIP padding'
  }
  'view' {
   $child=Native-Text $Nodes 'Padded child'
   Assert (($root.box.width -lt 200) -and (Near $root.box.height 60)) 'Resized View is below its width cap and retains its height'
   Assert ((Near ($child.box.x-$root.box.x) 17) -and (Near ($child.box.y-$root.box.y) 7) -and (Near $child.box.width ($root.box.width-30))) 'Resized View preserves asymmetric padding'
   $text=Named $Tree 'Padded child'
   Assert ((Finite $text) -and (Near $text.width $child.box.width)) 'Resized padded child has matching UIA width'
  }
  'center' {
   $child=Native-Text $Nodes 'Centered child'
   Assert (($root.box.width -lt 200) -and (Near $root.box.height 60)) 'Resized Center is below its width cap and retains its height'
   Assert ((Near ($child.box.x-$root.box.x) (($root.box.width-80)/2)) -and (Near ($child.box.y-$root.box.y) 20)) 'Resized Center keeps its child centered'
   $text=Named $Tree 'Centered child'
   Assert ((Finite $text) -and (Near $text.width 80) -and (Near $text.height 20)) 'Resized centered child retains its UIA dimensions'
  }
  'section' {
   $child=Native-Text $Nodes 'Section child'
   Assert ((Near ($child.box.x-$root.box.x) 8) -and (Near ($child.box.y-$root.box.y) 8)) 'Resized Section preserves 8-DIP padding'
   Assert (Finite (Named $Tree 'Section child')) 'Resized Section content remains visible'
  }
 }
}
function Check-Layout([string]$Case,$Tree,$Nodes){
 if($Case -eq 'shrink'){
  $root=Native-Class $Nodes 'parity-shrink-root'
  $first=Native-Class $Nodes 'parity-shrink-first'
  $second=Native-Class $Nodes 'parity-shrink-second'
  Assert ((Near $root.box.width 170) -and (Near $root.box.height 20)) 'Maintained shrink fixture is 170 by 20 DIP'
  Assert ((Near $first.box.width 85) -and (Near $first.box.height 20)) 'First shrinking child is 85 by 20 DIP'
  Assert ((Near $second.box.width 85) -and (Near $second.box.height 20)) 'Second shrinking child is 85 by 20 DIP'
  Assert (Near ($first.box.x-$root.box.x) 0) 'First shrinking child starts at row origin'
  Assert (Near ($second.box.x-$first.box.x-$first.box.width) 0) 'Shrinking children meet without overlap'
  Assert (Near ($second.box.x+$second.box.width-$root.box.x-$root.box.width) 0) 'Second shrinking child ends at row edge'
  return
 }
 if($Case -eq 'text'){
  $text=Named $Tree 'Shared typography should wrap within the available space.'
  Assert ($text.type -eq 'ControlType.Text' -and (Finite $text)) 'Text has its text peer and visible bounds'
  Assert (($text.patterns -contains 'TextPatternIdentifiers.Pattern') -and $text.height -gt 30) 'Text exposes Text and wraps' $text.height
  Assert (Near $text.width 220) 'Text uses the constrained width' $text.width
  return
 }
 $labels=@{vstack='Vertical';hstack='Horizontal';stack='Stack';view='View';center='Center';section='Section'}
 $group=Named $Tree ($labels[$Case]+' 0')
 Assert ($group.type -eq 'ControlType.Group' -and (Finite $group)) "$Case exposes a named group with visible bounds"
 $root=Native-Id $Nodes "core20-$Case"
 switch($Case){
  {$_ -in @('vstack','hstack','stack')} {
   $first=Named $Tree ($labels[$Case]+' first')
   $second=Named $Tree ($labels[$Case]+' second')
   Assert ((Finite $first) -and (Finite $second)) "$Case child bounds are visible"
   if($Case -eq 'vstack'){
    Assert ((Near (($second.y-$first.y)/$script:Scale-$first.height) 8) -and (Near $first.x $second.x)) 'VStack has ordered children and an 8-DIP gap'
   }else{
    Assert ((Near (($second.x-$first.x)/$script:Scale-$first.width) 8) -and (Near $first.y $second.y)) "$Case has ordered children and an 8-DIP gap"
   }
   $child=Native-Text $Nodes ($labels[$Case]+' first')
   Assert ((Near ($child.box.x-$root.box.x) 8) -and (Near ($child.box.y-$root.box.y) 8)) "$Case has 8-DIP padding"
  }
  'view' {
   $child=Native-Text $Nodes 'Padded child'
   Assert ((Near $root.box.width 200) -and (Near $root.box.height 60)) 'View frame is 200 by 60 DIP'
   Assert ((Near ($child.box.x-$root.box.x) 17) -and (Near ($child.box.y-$root.box.y) 7) -and (Near $child.box.width 170)) 'View applies asymmetric padding'
   $text=Named $Tree 'Padded child'
   Assert ((Finite $text) -and (Near $text.width $child.box.width)) 'View child UIA width matches its native width'
  }
  'center' {
   $child=Native-Text $Nodes 'Centered child'
   Assert ((Near $root.box.width 200) -and (Near $root.box.height 60)) 'Center frame is 200 by 60 DIP'
   Assert ((Near ($child.box.x-$root.box.x) 60) -and (Near ($child.box.y-$root.box.y) 20)) 'Center centers its 80 by 20 child'
   $text=Named $Tree 'Centered child'
   Assert ((Finite $text) -and (Near $text.width 80) -and (Near $text.height 20)) 'Centered child has matching UIA dimensions'
  }
  'section' {
   $child=Native-Text $Nodes 'Section child'
   Assert ((Near ($child.box.x-$root.box.x) 8) -and (Near ($child.box.y-$root.box.y) 8)) 'Section applies 8-DIP padding'
  }
 }
}
Add-Type @'
using System;
using System.Runtime.InteropServices;
using System.Threading;
public static class Core20ActionInput {
 [StructLayout(LayoutKind.Sequential)] public struct Point { public int X,Y; }
 [StructLayout(LayoutKind.Sequential)] public struct Mouse { public int X,Y; public uint Data,Flags,Time; public UIntPtr Extra; }
 [StructLayout(LayoutKind.Sequential)] public struct Key { public ushort Code,Scan; public uint Flags,Time; public UIntPtr Extra; }
 [StructLayout(LayoutKind.Explicit)] public struct Union { [FieldOffset(0)] public Mouse Mouse; [FieldOffset(0)] public Key Key; }
 [StructLayout(LayoutKind.Sequential)] public struct Input { public uint Type; public Union Data; }
 [DllImport("user32.dll",SetLastError=true)] static extern uint SendInput(uint count,Input[] inputs,int size);
 [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
 [DllImport("user32.dll")] public static extern bool SetCursorPos(int x,int y);
 [DllImport("user32.dll")] public static extern bool GetCursorPos(out Point point);
 static void Send(Input[] inputs) { if(SendInput((uint)inputs.Length,inputs,Marshal.SizeOf(typeof(Input)))!=inputs.Length) throw new Exception("SendInput failed: "+Marshal.GetLastWin32Error()); }
 public static void Press(ushort code,bool shift) {
  var down=new Input {Type=1,Data=new Union {Key=new Key {Code=code}}};
  var up=down;up.Data.Key.Flags=2;
  var shiftDown=new Input {Type=1,Data=new Union {Key=new Key {Code=16}}};
  var shiftUp=shiftDown;shiftUp.Data.Key.Flags=2;
  Send(shift?new[]{shiftDown,down,up,shiftUp}:new[]{down,up});
 }
 public static void Click(int x,int y) {
  if(!SetCursorPos(x,y)) throw new Exception("SetCursorPos failed");
  Send(new[]{new Input {Type=0,Data=new Union {Mouse=new Mouse {Flags=2}}},new Input {Type=0,Data=new Union {Mouse=new Mouse {Flags=4}}}});
 }
}
'@
$script:ActionCount=0
function Uia-Action([string]$Operation,[string]$Name='',[string]$Type=''){
 $script:ActionCount++
 $directory=Join-Path $OutputDirectory ('uia-actions/'+$script:ActionCount.ToString('D4'))
 New-Item -ItemType Directory -Path $directory -Force|Out-Null
 $prefix=Join-Path $directory 'action'
 $requestPath=Join-Path $directory 'request.json'
 @{windowHandle=$script:WindowHandle.ToInt64();expectedProcessId=$script:AppProcessId;operation=$Operation;name=$Name;controlType=$Type}|ConvertTo-Json|Set-Content $requestPath -Encoding UTF8
 $arguments=@('-NoProfile','-NonInteractive','-MTA','-ExecutionPolicy','Bypass','-File',('"'+$PSScriptRoot+'/action-uia.ps1"'),'-RequestPath',('"'+$requestPath+'"'),'-OutputPrefix',('"'+$prefix+'"'))
 $client=Start-Process powershell.exe -ArgumentList $arguments -WindowStyle Hidden -PassThru -RedirectStandardOutput ($prefix+'-stdout.log') -RedirectStandardError ($prefix+'-stderr.log')
 try{
  $clientHandle=$client.Handle
  if(-not $client.WaitForExit(20000)){
   $stage=if(Test-Path ($prefix+'-stage.txt')){[IO.File]::ReadAllText($prefix+'-stage.txt')}else{'startup'}
   throw "UIA action timed out at $stage"
  }
  if($null -eq $client.ExitCode -or $client.ExitCode -ne 0){throw "UIA action failed; see $directory"}
  $result=Get-Content ($prefix+'-result.json') -Raw|ConvertFrom-Json
  if($result.rootProcessId -ne $script:AppProcessId -or $result.status -notin @('completed','rejected')){throw 'UIA action identity or completion mismatch'}
  return $result
 }finally{
  if(-not $client.HasExited){$client.Kill();$null=$client.WaitForExit(5000)}
  $client.Dispose()
 }
}
function Focused([string]$Name){
 $result=Uia-Action 'focused'
 return @($result.focused|Where-Object {$_.name -ceq $Name}).Count -eq 1
}
function Focus-Action([string]$Name,[string]$Type){
 $result=Uia-Action 'focus' $Name $Type
 Assert ($result.status -eq 'completed') "UIA focus accepted for $Name" $result
 Wait-For {Focused $Name} "Keyboard focus missing on $Name"
}
function Input-Owner {
 if([Core20ActionInput]::GetForegroundWindow() -ne $script:WindowHandle){
  [Core20Desktop]::SetForegroundWindow($script:WindowHandle)|Out-Null
 }
 if([Core20ActionInput]::GetForegroundWindow() -ne $script:WindowHandle){throw 'Owned window is not foreground; refusing input'}
}
function Key([int]$Code,[bool]$Shift=$false){Input-Owner;[Core20ActionInput]::Press($Code,$Shift)}
function Click-Control($Control){
 Input-Owner
 [Core20ActionInput]::Click([int]($Control.x+$Control.width*$script:Scale/2),[int]($Control.y+$Control.height*$script:Scale/2))
}
function Activations([string]$Source){
 return @(Read-Events|Where-Object {$_.bootId -eq $script:Boot.bootId -and $_.event -eq 'activation' -and $_.source -ceq $Source}).Count
}
function Exactly-Once([string]$Source,[string]$InputKind,[scriptblock]$Action){
 $before=Activations $Source
 & $Action
 Wait-For {(Activations $Source) -ge $before+1} "No $Source activation from $InputKind"
 Start-Sleep -Milliseconds 500
 Assert ((Activations $Source) -eq $before+1) "$Source $InputKind activates exactly once" (Activations $Source)
}
function Action-Shape($Tree,[string]$Name,[string]$Type){
 $controls=@($Tree|Where-Object {$_.name -ceq $Name -and $_.type -ceq $Type})
 Assert ($controls.Count -eq 1) "One $Type named $Name" $controls.Count
 $control=$controls[0]
 Assert (Finite $control) "$Name has visible finite bounds" $control
 Assert $control.focusable "$Name is keyboard focusable"
 Assert ($control.patterns -contains 'InvokePatternIdentifiers.Pattern') "$Name exposes Invoke"
 return $control
}

function No-Activation([string]$Source,[string]$InputKind,[scriptblock]$Action){
 $before=Activations $Source
 & $Action
 Start-Sleep -Milliseconds 500
 Assert ((Activations $Source) -eq $before) "$Source rejects disabled $InputKind" (Activations $Source)
}
function Check-PeerFrame($Tree,[string]$Source,[string]$Name,[string]$Type,[string]$Stage){
 $control=Action-Shape $Tree $Name $Type
 $nodes=Snapshot $Stage
 $root=Native-Id $nodes ('core20-'+$Source)
 Assert ((Near ($control.x/$script:Scale) $root.box.x) -and (Near ($control.y/$script:Scale) $root.box.y)) 'Peer begins at the drawn component frame' @{peer=$control;drawn=$root.box}
 Assert ((Near $control.width $root.box.width) -and (Near $control.height $root.box.height)) 'Peer covers the drawn component frame' @{peer=$control;drawn=$root.box}
 return $control
}
function Reset-Display($Spec,[int]$Revision=0){
 Command 'mounted' $false|Out-Null
 Command 'revision' $Revision|Out-Null
 Command 'disabled' $false|Out-Null
 Command 'banner-details' $false|Out-Null
 Command 'display-case' $Spec.displayCase|Out-Null
 Command 'scene' 'display'|Out-Null
 Command 'mounted' $true|Out-Null
 Status-Contains 'Core20 display '
 Status-Contains ("revision=$Revision mounted=true")
}
function Display-Peer($Spec,[string]$Name,[string]$Stage){
 $control=Action-Shape (Capture $Stage) $Name 'ControlType.Button'
 Assert $control.enabled 'Enabled display action reports IsEnabled=true'
 $nodes=Snapshot $Stage
 $drawn=if($Spec.source -eq 'banner-dismiss'){
  Native-Class $nodes 'vx-banner-dismiss'
 }else{Native-Id $nodes ('core20-'+$Spec.source)}
 Assert ((Near ($control.x/$script:Scale) $drawn.box.x) -and (Near ($control.y/$script:Scale) $drawn.box.y)) 'Display peer begins at its drawn frame' @{peer=$control;drawn=$drawn.box}
 Assert ((Near $control.width $drawn.box.width) -and (Near $control.height $drawn.box.height)) 'Display peer covers its drawn frame' @{peer=$control;drawn=$drawn.box}
 return $control
}
function Display-TabOrder($Spec,[int]$Revision=0,[bool]$Disabled=$false){
 $names=if($Spec.displayCase -eq 'card'){
  if($Disabled){@('Before display','After display')}else{@('Before display',"Open card $Revision",'After display')}
 }else{
  if($Disabled){@('Before display',"Dismiss Banner $Revision",'After display')}else{@('Before display',"Banner action $Revision", "Dismiss Banner $Revision",'After display')}
 }
 Focus-Action 'Before display' 'ControlType.Button'
 for($index=1;$index -lt $names.Count;$index++){
  Key 9
  $expected=$names[$index]
  Wait-For {Focused $expected} "Tab did not reach $expected"
  Assert $true "Physical Tab focuses $expected"
 }
 for($index=$names.Count-2;$index -ge 0;$index--){
  Key 9 $true
  $expected=$names[$index]
  Wait-For {Focused $expected} "Shift+Tab did not return to $expected"
  Assert $true "Physical Shift+Tab focuses $expected"
 }
}
function Assert-DisplayRevision([string]$Source,[int]$Revision){
 $events=@(Read-Events|Where-Object {$_.bootId -eq $script:Boot.bootId -and $_.event -eq 'activation' -and $_.source -ceq $Source})
 Assert ($events.Count -gt 0 -and $events[-1].fixtureRevision -eq $Revision) 'Display callback observes the current fixture revision' $events[-1]
}
function Reset-ListItem([int]$Revision=0){
 Command 'mounted' $false|Out-Null
 Command 'revision' $Revision|Out-Null
 Command 'disabled' $false|Out-Null
 Command 'scene' 'collections'|Out-Null
 Command 'mounted' $true|Out-Null
 Status-Contains 'Core20 collections '
 Status-Contains ("revision=$Revision mounted=true")
}
function ListItem-TabOrder([int]$Revision=0,[bool]$Disabled=$false){
 $names=if($Disabled){@('Before list','After list')}else{@('Before list',"Open row $Revision",'After list')}
 Focus-Action 'Before list' 'ControlType.Button'
 for($index=1;$index -lt $names.Count;$index++){
  Key 9
  $expected=$names[$index]
  Wait-For {Focused $expected} "Tab did not reach $expected"
  Assert $true "Physical Tab focuses $expected"
 }
 for($index=$names.Count-2;$index -ge 0;$index--){
  Key 9 $true
  $expected=$names[$index]
  Wait-For {Focused $expected} "Shift+Tab did not return to $expected"
  Assert $true "Physical Shift+Tab focuses $expected"
 }
}
function Check-ListItemActions {
 $script:Checks.Clear()
 $entry=[ordered]@{case='list-item-input';status='running';checks=$null;error=$null;disabledApplicability='required'}
 try{
  Reset-ListItem
  $name='Open row 0'
  $control=Check-PeerFrame (Capture 'list-item-default') 'list-item' $name 'ControlType.Button' 'list-item-default'
  Assert $control.enabled 'Enabled ListItem peer reports IsEnabled=true'
  ListItem-TabOrder
  Focus-Action $name 'ControlType.Button'
  Exactly-Once 'list-item' 'Enter' {Key 13}
  Exactly-Once 'list-item' 'Space' {Key 32}
  Exactly-Once 'list-item' 'mouse' {Click-Control $control}
  Exactly-Once 'list-item' 'Invoke' {
   $invoked=Uia-Action 'invoke' $name 'ControlType.Button'
   Assert ($invoked.status -eq 'completed') 'ListItem Invoke accepted' $invoked
  }
  Command 'revision' 1|Out-Null
  Status-Contains 'revision=1 mounted=true'
  $updated=Capture 'list-item-updated'
  Check-PeerFrame $updated 'list-item' 'Open row 1' 'ControlType.Button' 'list-item-updated'|Out-Null
  Assert (@($updated|Where-Object {$_.name -ceq $name -and $_.type -ceq 'ControlType.Button'}).Count -eq 0) 'Updated ListItem name replaces its previous name'
  Exactly-Once 'list-item' 'updated Invoke' {
   $invoked=Uia-Action 'invoke' 'Open row 1' 'ControlType.Button'
   Assert ($invoked.status -eq 'completed') 'Updated ListItem Invoke accepted' $invoked
  }
  $events=@(Read-Events|Where-Object {$_.bootId -eq $script:Boot.bootId -and $_.event -eq 'activation' -and $_.source -ceq 'list-item'})
  Assert ($events.Count -gt 0 -and $events[-1].fixtureRevision -eq 1) 'ListItem callback observes the current fixture revision' $events[-1]
  Command 'mounted' $false|Out-Null
  Status-Contains 'mounted=false'
  $absent=Capture 'list-item-unmounted'
  Assert (@($absent|Where-Object {$_.name -in @($name,'Open row 1') -and $_.type -ceq 'ControlType.Button'}).Count -eq 0) 'Unmount removes the ListItem action peer'
  Command 'revision' 0|Out-Null
  Command 'mounted' $true|Out-Null
  Status-Contains 'revision=0 mounted=true'
  Check-PeerFrame (Capture 'list-item-remounted') 'list-item' $name 'ControlType.Button' 'list-item-remounted'|Out-Null
  Exactly-Once 'list-item' 'remounted Invoke' {
   $invoked=Uia-Action 'invoke' $name 'ControlType.Button'
   Assert ($invoked.status -eq 'completed') 'Remounted ListItem Invoke accepted' $invoked
  }
  Command 'disabled' $true|Out-Null
  $tree=Capture 'list-item-disabled'
  $disabled=@($tree|Where-Object {$_.name -ceq $name -and $_.type -ceq 'ControlType.Button'})
  Assert ($disabled.Count -eq 1 -and -not $disabled[0].enabled) 'Disabled ListItem peer reports IsEnabled=false'
  Assert (Finite $disabled[0]) 'Disabled ListItem retains visible finite bounds' $disabled[0]
  $focus=Uia-Action 'focus' $name 'ControlType.Button'
  Assert (-not $focus.targetFocused) 'Disabled ListItem rejects focus' $focus
  Focus-Action 'Before list' 'ControlType.Button'
  No-Activation 'list-item' 'Enter' {Key 13}
  No-Activation 'list-item' 'Space' {Key 32}
  No-Activation 'list-item' 'mouse' {Click-Control $disabled[0]}
  No-Activation 'list-item' 'Invoke' {
   $invoked=Uia-Action 'invoke' $name 'ControlType.Button'
   Assert ($invoked.status -eq 'rejected') 'Disabled ListItem Invoke rejected' $invoked
  }
  ListItem-TabOrder 0 $true
  Command 'disabled' $false|Out-Null
  Check-PeerFrame (Capture 'list-item-reenabled') 'list-item' $name 'ControlType.Button' 'list-item-reenabled'|Out-Null
  Focus-Action $name 'ControlType.Button'
  Exactly-Once 'list-item' 'reenabled Enter' {Key 13}
  $wide=Check-PeerFrame (Capture 'list-item-wide') 'list-item' $name 'ControlType.Button' 'list-item-wide'
  if(-not [Core20Desktop]::MoveWindow($script:WindowHandle,$left,$top,$narrowWidth,$height,$true)){throw 'Cannot narrow the owned list window'}
  $narrow=Check-PeerFrame (Capture 'list-item-narrow') 'list-item' $name 'ControlType.Button' 'list-item-narrow'
  Assert ($narrow.width -lt $wide.width) 'ListItem peer and drawing shrink together on resize' @{wide=$wide.width;narrow=$narrow.width}
  if(-not [Core20Desktop]::MoveWindow($script:WindowHandle,$left,$top,$wideWidth,$height,$true)){throw 'Cannot restore the owned list window'}
  Check-PeerFrame (Capture 'list-item-wide-restored') 'list-item' $name 'ControlType.Button' 'list-item-wide-restored'|Out-Null
  $entry.status='assertions-passed'
 }catch{$entry.status='failed';$entry.error=$_.Exception.Message}
 finally{$entry.checks=@($script:Checks.ToArray());$script:Cases.Add([pscustomobject]$entry);Save-CaseProgress}
}
function Save-CaseProgress {
 $progress=[ordered]@{
  schemaVersion=1;status='partial';qualification='pending'
  packageVersion=$report.packageVersion;source=$report.source;launchId=$report.launchId
  driverSha256=$report.driverSha256;masonSha256=$report.masonSha256
  displayActionCase=$DisplayActionCase;preflightChecks=$report.preflightChecks
  cases=@($script:Cases.ToArray())
 }
 $path=Join-Path $OutputDirectory 'case-progress.json'
 [IO.File]::WriteAllText(($path+'.tmp'),($progress|ConvertTo-Json -Depth 12),[Text.UTF8Encoding]::new($false))
 Move-Item -LiteralPath ($path+'.tmp') -Destination $path -Force
}
function Check-DisplayActions {
 $displaySpecs=@(
  @{source='clickable-card';displayCase='card';label='Open card';disabled=$true},
  @{source='banner-action';displayCase='banner';label='Banner action';disabled=$true},
  @{source='banner-dismiss';displayCase='banner';label='Dismiss Banner';disabled=$false}
 )
 if($DisplayActionCase -ne 'all'){$displaySpecs=@($displaySpecs|Where-Object {$_.source -eq $DisplayActionCase})}
 if(-not $displaySpecs.Count){throw 'The selected display action case is missing'}
 foreach($spec in $displaySpecs){
  $script:Checks.Clear()
  $entry=[ordered]@{case=$spec.source;status='running';checks=$null;error=$null;disabledApplicability=if($spec.disabled){'required'}else{'not-applicable: BannerProps has no disabled dismissal prop'}}
  try{
   Reset-Display $spec
   $name=$spec.label+' 0'
   Display-TabOrder $spec
   foreach($method in @('Enter','Space','mouse','Invoke')){
    # A dismiss removes its Banner. Every method gets a fresh public mount.
    Reset-Display $spec
    $control=Display-Peer $spec $name ($spec.source+'-'+$method)
    Focus-Action $name 'ControlType.Button'
    Exactly-Once $spec.source $method {
     switch($method){
      'Enter'{Key 13}
      'Space'{Key 32}
      'mouse'{Click-Control $control}
      'Invoke'{$invoked=Uia-Action 'invoke' $name 'ControlType.Button';Assert ($invoked.status -eq 'completed') 'Display Invoke accepted' $invoked}
     }
    }
    Assert-DisplayRevision $spec.source 0
    if($spec.source -eq 'banner-dismiss'){
     $absent=Capture ('banner-dismiss-'+$method+'-removed')
     Assert (@($absent|Where-Object {$_.name -ceq $name -and $_.type -ceq 'ControlType.Button'}).Count -eq 0) 'Dismiss removes its native action peer'
     $nodes=Snapshot ('banner-dismiss-'+$method+'-removed')
     Assert (@($nodes|Where-Object {$_.id -ceq 'core20-banner'}).Count -eq 0) 'Dismiss removes the Banner content'
     $before=Activations $spec.source
     Click-Control $control
     Start-Sleep -Milliseconds 500
     Assert ((Activations $spec.source) -eq $before) 'Clicking the removed dismiss frame cannot activate it again'
    }
   }
   Reset-Display $spec
   Command 'revision' 1|Out-Null
   Status-Contains 'revision=1 mounted=true'
   $updatedName=$spec.label+' 1'
   $updated=Capture ($spec.source+'-updated')
   Action-Shape $updated $updatedName 'ControlType.Button'|Out-Null
   Assert (@($updated|Where-Object {$_.name -ceq $name -and $_.type -ceq 'ControlType.Button'}).Count -eq 0) 'New display name replaces its previous name'
   Exactly-Once $spec.source 'updated Invoke' {
    $invoked=Uia-Action 'invoke' $updatedName 'ControlType.Button'
    Assert ($invoked.status -eq 'completed') 'Updated display Invoke accepted' $invoked
   }
   Assert-DisplayRevision $spec.source 1
   Reset-Display $spec
   Command 'mounted' $false|Out-Null
   Status-Contains 'mounted=false'
   $absent=Capture ($spec.source+'-unmounted')
   Assert (@($absent|Where-Object {$_.name -ceq $name -and $_.type -ceq 'ControlType.Button'}).Count -eq 0) 'Unmount removes the display action peer'
   Command 'mounted' $true|Out-Null
   Status-Contains 'revision=0 mounted=true'
   Display-Peer $spec $name ($spec.source+'-remounted')|Out-Null
   Exactly-Once $spec.source 'remounted Invoke' {
    $invoked=Uia-Action 'invoke' $name 'ControlType.Button'
    Assert ($invoked.status -eq 'completed') 'Remounted display Invoke accepted' $invoked
   }
   Assert-DisplayRevision $spec.source 0
   if($spec.disabled){
    Reset-Display $spec
    Command 'disabled' $true|Out-Null
    $tree=Capture ($spec.source+'-disabled')
    $disabled=@($tree|Where-Object {$_.name -ceq $name -and $_.type -ceq 'ControlType.Button'})
    Assert ($disabled.Count -eq 1 -and -not $disabled[0].enabled) 'Disabled display peer reports IsEnabled=false'
    $focus=Uia-Action 'focus' $name 'ControlType.Button'
    Assert (-not $focus.targetFocused) 'Disabled display peer rejects focus' $focus
    # Keep keys away from Banner's still-enabled dismiss action.
    Focus-Action 'Before display' 'ControlType.Button'
    No-Activation $spec.source 'Enter' {Key 13}
    No-Activation $spec.source 'Space' {Key 32}
    No-Activation $spec.source 'mouse' {Click-Control $disabled[0]}
    No-Activation $spec.source 'Invoke' {
     $invoked=Uia-Action 'invoke' $name 'ControlType.Button'
     Assert ($invoked.status -eq 'rejected') 'Disabled display Invoke rejected' $invoked
    }
    Display-TabOrder $spec 0 $true
    Command 'disabled' $false|Out-Null
    Display-Peer $spec $name ($spec.source+'-reenabled')|Out-Null
    Focus-Action $name 'ControlType.Button'
    Exactly-Once $spec.source 'reenabled Enter' {Key 13}
   }
   Reset-Display $spec
   if(-not [Core20Desktop]::MoveWindow($script:WindowHandle,$left,$top,$narrowWidth,$height,$true)){throw 'Cannot narrow the owned display window'}
   Display-Peer $spec $name ($spec.source+'-narrow')|Out-Null
   if(-not [Core20Desktop]::MoveWindow($script:WindowHandle,$left,$top,$wideWidth,$height,$true)){throw 'Cannot restore the owned display window'}
   Display-Peer $spec $name ($spec.source+'-wide')|Out-Null
   $entry.status='assertions-passed'
  }catch{$entry.status='failed';$entry.error=$_.Exception.Message}
  finally{$entry.checks=@($script:Checks.ToArray());$script:Cases.Add([pscustomobject]$entry);Save-CaseProgress}
 }
}
function Reset-Tabs([int]$Revision=0){
 Command 'mounted' $false|Out-Null
 Command 'revision' $Revision|Out-Null
 Command 'disabled' $false|Out-Null
 Command 'scene' 'tabs'|Out-Null
 Command 'mounted' $true|Out-Null
 Status-Contains ("revision=$Revision mounted=true")
}
function Tab-Shape($Tree,[string]$Name,[bool]$Enabled=$true){
 $tabs=@($Tree|Where-Object {$_.type -eq 'ControlType.TabItem'})
 $tab=Named $tabs $Name
 Assert (Finite $tab) "TabItem $Name has visible finite bounds" $tab
 Assert ($tab.patterns -contains 'SelectionItemPatternIdentifiers.Pattern') "TabItem $Name exposes SelectionItem" $tab.patterns
 Assert ($tab.enabled -eq $Enabled) "TabItem $Name has expected enabled state" $tab.enabled
 return $tab
}
function Tab-State([string]$Value,[int]$Revision,[string]$Stage){
 $tree=Capture $Stage
 $tabs=@($tree|Where-Object {$_.type -eq 'ControlType.TabItem'})
 Assert ($tabs.Count -eq 3) 'The public TabList exposes exactly three TabItem peers' $tabs.Count
 $name=if($Value -eq 'first'){"First $Revision"}else{"Third $Revision"}
 $selected=@($tabs|Where-Object {$_.selected})
 Assert ($selected.Count -eq 1 -and $selected[0].name -ceq $name) "Controlled UIA selection is $name" $selected
 Named $tree ("Tabs selected $Value")|Out-Null
 Named $tree ("Panel $Value revision $Revision")|Out-Null
 return ,$tree
}
function Tab-Stop([string]$Selected){
 Focus-Action 'Before tabs' 'ControlType.Button'
 Key 9
 Wait-For {Focused $Selected} "Tab did not enter selected $Selected"
 Assert $true 'A physical Tab enters the selected tab'
 Key 9
 Wait-For {Focused 'After tabs'} 'Tab did not leave the composite after one stop'
 Assert $true 'The tab composite has one forward Tab stop'
 Key 9 $true
 Wait-For {Focused $Selected} 'Shift+Tab did not return to selected tab'
 Assert $true 'A physical Shift+Tab enters the selected tab'
 Key 9 $true
 Wait-For {Focused 'Before tabs'} 'Shift+Tab did not leave the composite after one stop'
 Assert $true 'The tab composite has one backward Tab stop'
}
function No-TabRequest([string]$InputKind,[scriptblock]$Action){
 $before=@(Read-Events|Where-Object {$_.event -eq 'activation' -and $_.source -like 'tab-selection:*'}).Count
 & $Action
 Start-Sleep -Milliseconds 500
 $after=@(Read-Events|Where-Object {$_.event -eq 'activation' -and $_.source -like 'tab-selection:*'}).Count
 Assert ($after -eq $before) "Disabled tab rejects $InputKind without any selection callback" @{before=$before;after=$after}
}
function Check-TabActions {
 $script:Checks.Clear()
 $entry=[ordered]@{case='public-tabs';status='running';checks=$null;error=$null}
 try{
  Reset-Tabs
  Snapshot 'public-tabs-native'|Out-Null
  $tree=Tab-State 'first' 0 'public-tabs-default'
  $first=Tab-Shape $tree 'First 0'
  $disabled=Tab-Shape $tree 'Unavailable' $false
  $third=Tab-Shape $tree 'Third 0'
  Assert ($first.x+$first.width*$script:Scale -le $disabled.x+2*$script:Scale -and $disabled.x+$disabled.width*$script:Scale -le $third.x+2*$script:Scale) 'Tab headers are ordered without overlap' @($first,$disabled,$third)
  Assert (-not $disabled.focusable) 'Disabled tab is not keyboard focusable' $disabled
  Tab-Stop 'First 0'
  Exactly-Once 'tab-selection:third' 'mouse' {Click-Control $third}
  Tab-State 'third' 0 'public-tabs-mouse-third'|Out-Null
  Tab-Stop 'Third 0'
  Exactly-Once 'tab-selection:first' 'mouse' {Click-Control $first}
  Focus-Action 'First 0' 'ControlType.TabItem'
  Exactly-Once 'tab-selection:third' 'Right Arrow' {Key 39}
  Tab-State 'third' 0 'public-tabs-right'|Out-Null
  Wait-For {Focused 'Third 0'} 'Right Arrow did not focus third after skipping disabled'
  Assert $true 'Arrow selection focuses its enabled destination'
  Exactly-Once 'tab-selection:first' 'Left Arrow' {Key 37}
  Tab-State 'first' 0 'public-tabs-left'|Out-Null
  Exactly-Once 'tab-selection:third' 'End' {Key 35}
  Tab-State 'third' 0 'public-tabs-end'|Out-Null
  Exactly-Once 'tab-selection:first' 'Home' {Key 36}
  Tab-State 'first' 0 'public-tabs-home'|Out-Null
  Exactly-Once 'tab-selection:third' 'UIA Select' {$r=Uia-Action 'select' 'Third 0' 'ControlType.TabItem';Assert ($r.status -eq 'completed') 'SelectionItem.Select completes' $r}
  Tab-State 'third' 0 'public-tabs-selected-third'|Out-Null
  No-TabRequest 'mouse' {Click-Control $disabled}
  No-TabRequest 'UIA Select' {$r=Uia-Action 'select' 'Unavailable' 'ControlType.TabItem';$entry.disabledSelectStatus=$r.status}
  $r=Uia-Action 'focus' 'Unavailable' 'ControlType.TabItem'
  Assert (-not $r.targetFocused) 'Disabled tab rejects UIA focus' $r
  Tab-State 'third' 0 'public-tabs-disabled-selection-unchanged'|Out-Null
  Command 'revision' 1|Out-Null
  $updated=Tab-State 'third' 1 'public-tabs-updated'
  Tab-Shape $updated 'First 1'|Out-Null
  Assert (@($updated|Where-Object {$_.type -eq 'ControlType.TabItem' -and $_.name -in @('First 0','Third 0')}).Count -eq 0) 'Prop update replaces old accessible names'
  Exactly-Once 'tab-selection:first' 'updated Select' {Uia-Action 'select' 'First 1' 'ControlType.TabItem'|Out-Null}
  Assert-DisplayRevision 'tab-selection:first' 1
  Tab-State 'first' 1 'public-tabs-updated-selection'|Out-Null
  Command 'revision' 2|Out-Null
  Tab-State 'first' 2 'public-tabs-rejecting-default'|Out-Null
  Exactly-Once 'tab-selection:third' 'controlled rejection' {Uia-Action 'select' 'Third 2' 'ControlType.TabItem'|Out-Null}
  Assert-DisplayRevision 'tab-selection:third' 2
  Tab-State 'first' 2 'public-tabs-controlled-rejection'|Out-Null
  Focus-Action 'First 2' 'ControlType.TabItem'
  Exactly-Once 'tab-selection:third' 'rejected Right Arrow' {Key 39}
  Tab-State 'first' 2 'public-tabs-controlled-arrow-rejection'|Out-Null
  Command 'disabled' $true|Out-Null
  $allDisabled=Capture 'public-tabs-disabled-third'
  $disabledThird=Tab-Shape $allDisabled 'Third 2' $false
  No-TabRequest 'disabled mouse' {Click-Control $disabledThird}
  No-TabRequest 'disabled Select' {$r=Uia-Action 'select' 'Third 2' 'ControlType.TabItem';$entry.updatedDisabledSelectStatus=$r.status}
  Tab-State 'first' 2 'public-tabs-updated-disabled-selection-unchanged'|Out-Null
  Tab-Stop 'First 2'
  Command 'mounted' $false|Out-Null
  Status-Contains 'mounted=false'
  $absent=Capture 'public-tabs-unmounted'
  Assert (@($absent|Where-Object {$_.type -eq 'ControlType.TabItem'}).Count -eq 0) 'Unmount releases all tab peers'
  Reset-Tabs
  Tab-State 'first' 0 'public-tabs-remounted'|Out-Null
  Exactly-Once 'tab-selection:third' 'remounted Select' {Uia-Action 'select' 'Third 0' 'ControlType.TabItem'|Out-Null}
  Assert-DisplayRevision 'tab-selection:third' 0
  Tab-State 'third' 0 'public-tabs-remounted-third'|Out-Null
  Tab-Stop 'Third 0'
  $entry.status='assertions-passed'
 }catch{$entry.status='failed';$entry.error=$_.Exception.Message}
 finally{$entry.checks=@($script:Checks.ToArray());$script:Cases.Add([pscustomobject]$entry)}
}

function Reset-Selector([int]$Revision=0){
 Command 'mounted' $false|Out-Null
 Command 'revision' $Revision|Out-Null
 Command 'disabled' $false|Out-Null
 Command 'scene' 'selector'|Out-Null
 Command 'mounted' $true|Out-Null
 Status-Contains ("revision=$Revision mounted=true")
}
function Selector-Shape([int]$Revision,[string]$Stage,[bool]$Enabled=$true){
 $tree=Capture $Stage
 $peer=Named @($tree|Where-Object {$_.type -eq 'ControlType.ComboBox'}) ("Choice $Revision")
 Assert (Finite $peer) 'Selector ComboBox has finite visible bounds' $peer
 Assert ($peer.patterns -contains 'ExpandCollapsePatternIdentifiers.Pattern') 'Selector exposes ExpandCollapse' $peer.patterns
 Assert ($peer.enabled -eq $Enabled) 'Selector has expected enabled state' $peer.enabled
 $nodes=Snapshot $Stage
 $root=Native-Id $nodes 'core20-selector'
 Assert ((Near ($peer.x/$script:Scale) $root.box.x) -and (Near ($peer.y/$script:Scale) $root.box.y) -and (Near $peer.width $root.box.width) -and (Near $peer.height $root.box.height)) 'ComboBox covers the shared trigger drawing' @{peer=$peer;drawn=$root.box}
 return $peer
}
function Selector-Open([int]$Revision,[string]$Stage){
 $tree=Capture $Stage
 $items=@($tree|Where-Object {$_.type -eq 'ControlType.ListItem'})
 Assert ($items.Count -eq 3) 'Selector exposes three genuine ListItem option peers' $items.Count
 foreach($name in @("First $Revision",'Unavailable',"Third $Revision")){
  $item=Named $items $name
  Assert (Finite $item) "Option $name has visible finite bounds" $item
  Assert ($item.patterns -contains 'SelectionItemPatternIdentifiers.Pattern') "Option $name exposes SelectionItem" $item.patterns
 }
 $first=Named $items ("First $Revision");$third=Named $items ("Third $Revision");$disabled=Named $items 'Unavailable'
 Assert (-not $disabled.enabled -and -not $disabled.focusable) 'Disabled option rejects native focus' $disabled
 Assert ($first.y+$first.height*$script:Scale -le $disabled.y+2*$script:Scale -and $disabled.y+$disabled.height*$script:Scale -le $third.y+2*$script:Scale) 'Option rows are ordered without overlap' $items
 $nodes=Snapshot ($Stage+'-content')
 foreach($value in @('first','disabled','third')){
  $content=Native-Id $nodes ('core20-selector-option-'+$value)
  Assert ($content.box.width -gt 0 -and $content.box.height -gt 0) "Shared option content $value has nonempty bounds" $content.box
 }
 return ,$items
}
function Selector-ClosedRequests {
 return @(Read-Events|Where-Object {$_.bootId -eq $script:Boot.bootId -and $_.event -eq 'layer-open-change' -and $_.source -eq 'selector' -and $_.open -eq $false}).Count
}
function Selector-Values {
 return @(Read-Events|Where-Object {$_.bootId -eq $script:Boot.bootId -and $_.event -eq 'activation' -and $_.source -like 'selector-value:*'}).Count
}
function Selector-State([string]$Value,[bool]$Open,[string]$Stage){
 $tree=Capture $Stage
 Named $tree ("Selector value=$Value open="+$Open.ToString().ToLowerInvariant())|Out-Null
}
function Check-SelectorActions {
 $script:Checks.Clear()
 $entry=[ordered]@{case='public-selector-single';status='running';checks=$null;error=$null}
 try{
  Reset-Selector
  $trigger=Selector-Shape 0 'selector-initial'
  Focus-Action 'Before selector' 'ControlType.Button';Key 9
  Wait-For {Focused 'Choice 0'} 'Tab did not focus Selector'
  Key 9;Wait-For {Focused 'After selector'} 'Tab did not leave Selector after one stop'
  Assert $true 'Selector contributes one closed Tab stop'
  Focus-Action 'Choice 0' 'ControlType.ComboBox';Key 115
  $items=Selector-Open 0 'selector-keyboard-open'
  $before=Selector-Values
  $reject=Uia-Action 'select' 'Unavailable' 'ControlType.ListItem'
  Assert ($reject.status -eq 'rejected') 'Disabled option rejects SelectionItem.Select' $reject
  Click-Control (Named $items 'Unavailable')
  Assert ((Selector-Values) -eq $before) 'Disabled option mouse and selection requests do not commit'
  Selector-State 'first' $true 'selector-open-model'
  $before=Selector-Values;Key 40;Start-Sleep -Milliseconds 400
  Assert ((Selector-Values) -eq $before) 'Arrow navigation previews without committing' (Selector-Values)
  Exactly-Once 'selector-value:third' 'Down then Enter' {Key 13}
  Selector-State 'third' $false 'selector-enter-commit'
  Wait-For {Focused 'Choice 0'} 'Commit did not return focus to ComboBox'
  Click-Control $trigger
  $items=Selector-Open 0 'selector-mouse-open'
  Exactly-Once 'selector-value:first' 'mouse option' {Click-Control (Named $items 'First 0')}
  Selector-State 'first' $false 'selector-mouse-commit'
  Focus-Action 'Choice 0' 'ControlType.ComboBox';Key 115
  Selector-Open 0 'selector-before-escape'|Out-Null
  $before=Selector-Values;$closedBefore=Selector-ClosedRequests;Key 40;Key 27
  Selector-State 'first' $false 'selector-escape'
  Assert ((Selector-Values) -eq $before) 'Escape cancels preview without committing'
  Assert ((Selector-ClosedRequests) -eq $closedBefore+1) 'Escape reports one close request'
  Wait-For {Focused 'Choice 0'} 'Escape did not return focus to ComboBox'
  Click-Control $trigger;Selector-Open 0 'selector-before-outside'|Out-Null
  $outside=Named @((Capture 'selector-outside-target')|Where-Object {$_.type -eq 'ControlType.Button'}) 'Before selector'
  $closedBefore=Selector-ClosedRequests;Click-Control $outside;Selector-State 'first' $false 'selector-outside-dismiss'
  Assert ((Selector-ClosedRequests) -eq $closedBefore+1) 'Outside dismissal reports one close request'
  Focus-Action 'Choice 0' 'ControlType.ComboBox';Key 115
  Selector-Open 0 'selector-before-update'|Out-Null
  Command 'revision' 1|Out-Null
  Selector-Shape 1 'selector-updated-trigger'|Out-Null
  Selector-Open 1 'selector-updated-open-options'|Out-Null
  Exactly-Once 'selector-value:first' 'updated SelectionItem.Select' {$r=Uia-Action 'select' 'First 1' 'ControlType.ListItem';Assert ($r.status -eq 'completed') 'Updated native selection completed' $r}
  Selector-State 'first' $false 'selector-updated-commit'
  $events=@(Read-Events|Where-Object {$_.bootId -eq $script:Boot.bootId -and $_.event -eq 'activation' -and $_.source -eq 'selector-value:first'})
  Assert ($events[-1].fixtureRevision -eq 1) 'Retained selection reads the current callback revision' $events[-1]
  Reset-Selector 2
  Focus-Action 'Choice 2' 'ControlType.ComboBox';Key 115
  Selector-Open 2 'selector-rejected-open'|Out-Null
  Exactly-Once 'selector-value:third' 'controlled rejection' {Key 40;Key 13}
  Selector-State 'first' $false 'selector-rejected-value'
  Command 'disabled' $true|Out-Null
  $disabled=Selector-Shape 2 'selector-disabled' $false
  $before=Selector-Values
  $focus=Uia-Action 'focus' 'Choice 2' 'ControlType.ComboBox'
  Assert ($focus.status -eq 'rejected') 'Disabled Selector rejects UIA focus' $focus
  Click-Control $disabled;Selector-State 'first' $false 'selector-disabled-mouse'
  Assert ((Selector-Values) -eq $before) 'Disabled Selector rejects pointer selection'
  Focus-Action 'Before selector' 'ControlType.Button';Key 9
  Wait-For {Focused 'After selector'} 'Tab did not skip disabled Selector'
  Key 115;Selector-State 'first' $false 'selector-disabled-keys'
  Assert ((Selector-Values) -eq $before) 'Disabled Selector is skipped by Tab and stays closed on keys'
  Command 'mounted' $false|Out-Null
  $absent=Capture 'selector-unmounted'
  Assert (@($absent|Where-Object {$_.type -in @('ControlType.ComboBox','ControlType.ListItem')}).Count -eq 0) 'Unmount removes ComboBox and option peers'
  Reset-Selector
  Selector-Shape 0 'selector-remounted'|Out-Null
  Selector-State 'first' $false 'selector-remounted-default'
  Focus-Action 'Choice 0' 'ControlType.ComboBox';Key 115
  Selector-Open 0 'selector-remounted-open'|Out-Null
  Exactly-Once 'selector-value:third' 'remounted Enter' {Key 40;Key 13}
  Selector-State 'third' $false 'selector-remounted-commit'
  if(-not [Core20Desktop]::MoveWindow($script:WindowHandle,$left,$top,$narrowWidth,$height,$true)){throw 'Cannot narrow the owned Selector window'}
  $narrow=Selector-Shape 0 'selector-narrow'
  Assert ($narrow.width -lt $trigger.width) 'Selector trigger and native input peer shrink together' @{wide=$trigger.width;narrow=$narrow.width}
  Focus-Action 'Choice 0' 'ControlType.ComboBox';Key 115
  Selector-Open 0 'selector-narrow-open'|Out-Null
  Key 27
  if(-not [Core20Desktop]::MoveWindow($script:WindowHandle,$left,$top,$wideWidth,$height,$true)){throw 'Cannot restore the owned Selector window'}
  $wide=Selector-Shape 0 'selector-wide-restored'
  Assert (Near $wide.width $trigger.width) 'Selector restores its measured peer after widening' @{before=$trigger.width;after=$wide.width}

  $entry.status='assertions-passed'
 }catch{$entry.status='failed';$entry.error=$_.Exception.Message}
 finally{$entry.checks=@($script:Checks.ToArray());$script:Cases.Add([pscustomobject]$entry)}
}

$report=[ordered]@{
 schemaVersion=1;packageVersion=$pkg.Version.ToString();packageFamilyName=$pkg.PackageFamilyName
 driverSha256=(Get-FileHash -LiteralPath $PSCommandPath -Algorithm SHA256).Hash
 actionHelperSha256=(Get-FileHash -LiteralPath (Join-Path $PSScriptRoot 'action-uia.ps1') -Algorithm SHA256).Hash
 readerSha256=(Get-FileHash -LiteralPath (Join-Path $PSScriptRoot 'capture-uia.ps1') -Algorithm SHA256).Hash
 expectedCommit=$ExpectedCommit;allowDirtyProbe=[bool]$AllowDirtyProbe;displayActionCase=$DisplayActionCase
 scope=$(if($SelectorActions){'Public single Selector: ComboBox/SelectionItem peers, shared drawing bounds, keyboard/mouse commit, Escape/focus, outside dismissal, updates, controlled rejection, disabled, remount and trigger resize. Search/multiple/clear and full props, long lists and final fresh-main core20 qualification remain separate.'}elseif($TabActions){'Public panel TabList/Tab: genuine TabItem/SelectionItem, one Tab stop, OS arrows/mouse, disabled behavior, updates, controlled rejection, and unmount/remount. Does not establish structural insertion/reordering, rich-slot geometry, overflow resizing, or final fresh-install core20 qualification.'}elseif($DisplayActions){'ClickableCard, Banner end action and dismissal: real Tab/Enter/Space/mouse/Invoke, exactly-once callbacks, current revision, unmount/remount, frame alignment, resize and applicable disabled rejection. Does not replace display content/geometry qualification.'}elseif($ListItemActions){'ListItem input prerequisite: real Tab/Shift+Tab/Enter/Space/mouse/Invoke, exactly-once callbacks, current revision, unmount/remount, peer/drawing frames, resize and disabled rejection. Does not qualify List/ListItem structural roles, slot geometry, navigation or the wider props matrix; final core20 gates remain pending.'}else{'Action shape, sibling gap/order, native-peer frame alignment, resize, real Tab/Enter/Space/mouse/Invoke, prop updates, implicit names, unmount/remount, disabled focus/keys/Tab/mouse/Invoke, Link injected navigation callback. Diagnostic source build; final clean-main core20 qualification remains pending.'})
 qualification='pending';source=$null;launchId=$null;architecture=$pkg.Architecture.ToString();masonSha256=$null;preflightChecks=$null;cases=$script:Cases;error=$null
}
if($DisplayActions -and $DisplayActionCase -ne 'all'){$report.scope=('Selected '+$DisplayActionCase+' only. '+$report.scope)}
$savedCursor=[Core20ActionInput+Point]::new()
if(-not [Core20ActionInput]::GetCursorPos([ref]$savedCursor)){throw 'Cannot preserve pointer position'}
try {
 $owned=@(Get-Process windows -ErrorAction SilentlyContinue|Where-Object {$_.Path -and $_.Path.StartsWith($pkg.InstallLocation,[StringComparison]::OrdinalIgnoreCase)})
 if($owned.Count -gt 1){throw 'Multiple owned app processes need investigation'}
 $owned|Stop-Process
 Wait-For { @(Get-Process windows -ErrorAction SilentlyContinue|Where-Object {$_.Path -and $_.Path.StartsWith($pkg.InstallLocation,[StringComparison]::OrdinalIgnoreCase)}).Count -eq 0 } 'Previous owned process did not stop'
 $script:LogPath=(Get-ChildItem $dataRoot -Filter console.log -Recurse -File -ErrorAction SilentlyContinue|Select-Object -First 1).FullName
 $previousBoots=@(Read-Events|Where-Object {$_.event -eq 'ready'}|ForEach-Object {$_.bootId})
 Start-Process explorer.exe -ArgumentList "shell:AppsFolder\$($pkg.PackageFamilyName)!App"
 Wait-For {
  if(-not $script:LogPath){$script:LogPath=(Get-ChildItem $dataRoot -Filter console.log -Recurse -File -ErrorAction SilentlyContinue|Select-Object -First 1).FullName}
  $ready=@(Read-Events|Where-Object {$_.event -eq 'ready' -and $previousBoots -notcontains $_.bootId})
  if($ready.Count -eq 1){$script:Boot=$ready[0];return $true}
  return $false
 } 'Fresh harness ready event missing' 90
 $report.launchId=$script:Boot.bootId
 $report.source=$script:Boot.source
 Assert ($script:Boot.source.commit -ceq $ExpectedCommit) 'Embedded source commit matches the requested commit' $script:Boot.source.commit
 Assert ($script:Boot.source.dirty -eq $false -or $AllowDirtyProbe) 'Clean source, or explicitly recorded dirty probe' $script:Boot.source.dirty
 $expectedPath=Join-Path (Join-Path $dataRoot LocalState) 'core20-command.json'
 Assert ([IO.Path]::GetFullPath($script:Boot.commandPath).Equals($expectedPath,[StringComparison]::OrdinalIgnoreCase)) 'Command path belongs to this package'
 Wait-For {
  $script:Owned=@(Get-Process windows -ErrorAction SilentlyContinue|Where-Object {$_.Path -and $_.Path.StartsWith($pkg.InstallLocation,[StringComparison]::OrdinalIgnoreCase) -and $_.MainWindowHandle -ne [IntPtr]::Zero})
  return $script:Owned.Count -eq 1
 } 'Owned window did not appear'
 $process=$script:Owned[0]
 $windowHandle=$process.MainWindowHandle
 $windowOwner=[uint32]0
 $windowThread=[Core20Desktop]::GetWindowThreadProcessId($windowHandle,[ref]$windowOwner)
 Assert ($windowThread -ne 0 -and $windowOwner -eq $process.Id) 'Window handle belongs to the owned app' $windowOwner
 $script:WindowHandle=$windowHandle
 $script:AppProcessId=$process.Id
 $script:Scale=[Core20Desktop]::GetDpiForWindow($windowHandle)/96.0
 Assert ($script:Scale -gt 0) 'Window DPI is available' $script:Scale
 $capturedRect=[Core20Desktop+Rect]::new()
 if(-not [Core20Desktop]::GetWindowRect($windowHandle,[ref]$capturedRect)){throw 'Cannot preserve window position'}
 $original=$capturedRect
 $monitor=[Core20Desktop+MonitorInfo]::new()
 $monitor.Size=[Runtime.InteropServices.Marshal]::SizeOf([type][Core20Desktop+MonitorInfo])
 if(-not [Core20Desktop]::GetMonitorInfo([Core20Desktop]::MonitorFromWindow($windowHandle,2),[ref]$monitor)){throw 'Cannot read owned monitor work area'}
 $wideWidth=[int][math]::Min([math]::Ceiling(760*$script:Scale),$monitor.Work.Right-$monitor.Work.Left)
 $narrowWidth=[int][math]::Ceiling(320*$script:Scale)
 Assert ($wideWidth/$script:Scale -ge 640) 'Monitor work area supports the wide fixture baseline' $wideWidth
 $height=[math]::Min(900,$monitor.Work.Bottom-$monitor.Work.Top)
 $left=$monitor.Work.Left
 $top=$monitor.Work.Top
 [Core20Desktop]::ShowWindow($windowHandle,9)|Out-Null
 [Core20Desktop]::SetForegroundWindow($windowHandle)|Out-Null
 $mason=@($process.Modules|Where-Object {$_.ModuleName -eq 'NativeScript.Mason.dll'})
 Assert ($mason.Count -eq 1 -and $mason[0].FileName.StartsWith($pkg.InstallLocation,[StringComparison]::OrdinalIgnoreCase)) 'Exactly one package-owned Mason DLL is loaded'
 $report.masonSha256=(Get-FileHash $mason[0].FileName -Algorithm SHA256).Hash
 $report.preflightChecks=@($script:Checks.ToArray())
 if(-not [Core20Desktop]::MoveWindow($windowHandle,$left,$top,$wideWidth,$height,$true)){throw 'Cannot set the wide window size'}
 if($SelectorActions){
  Check-SelectorActions
 }elseif($TabActions){
  Check-TabActions
 }elseif($DisplayActions){
  Check-DisplayActions
 }elseif($ListItemActions){
  Check-ListItemActions
 }else{
 Command 'action-case' 'all'|Out-Null
 Command 'implicit-names' $false|Out-Null
 Command 'routed-link' $false|Out-Null
 Command 'revision' 0|Out-Null
 Command 'disabled' $false|Out-Null
 Command 'mounted' $true|Out-Null
 Command 'scene' 'actions'|Out-Null
 Status-Contains 'Core20 actions '
 Status-Contains 'revision=0 mounted=true'
 $tree=Capture 'actions-default'
 $specs=@(@{source='button';label='Button';type='ControlType.Button'},@{source='pressable';label='Pressable';type='ControlType.Button'},@{source='link';label='Link';type='ControlType.Hyperlink'})
 $controls=@()
 foreach($spec in $specs){$controls+=Check-PeerFrame $tree $spec.source ($spec.label+' 0') $spec.type ('all-'+$spec.source)}
 for($index=1;$index -lt $controls.Count;$index++){
  $gap=($controls[$index].y-$controls[$index-1].y)/$script:Scale-$controls[$index-1].height
  Assert (Near $gap 8) 'Action siblings are ordered with an 8-DIP gap and no overlap' $gap
 }
 Focus-Action 'Button 0' 'ControlType.Button'
 Key 9
 Wait-For {Focused 'Pressable 0'} 'Tab did not reach Pressable'
 Assert $true 'Physical Tab focuses Pressable'
 Key 9
 Wait-For {Focused 'Link 0'} 'Tab did not reach Link'
 Assert $true 'Physical Tab focuses Link'
 Key 9
 Wait-For {Focused 'Button 0'} 'Tab did not reach Button after Link'
 Assert $true 'Physical Tab focuses Button'
 Key 9 $true
 Wait-For {Focused 'Link 0'} 'Shift+Tab did not return to Link'
 Key 9 $true
 Wait-For {Focused 'Pressable 0'} 'Shift+Tab did not return to Pressable'
 Key 9 $true
 Wait-For {Focused 'Button 0'} 'Shift+Tab did not reach Button'
 Assert $true 'Physical Shift+Tab focuses Button'
 $report.preflightChecks=@($script:Checks.ToArray())
 foreach($spec in $specs){
  $script:Checks.Clear()
  $entry=[ordered]@{case=$spec.source;status='running';checks=$null;error=$null;disabledApplicability=if($spec.source -eq 'link'){'not-applicable: LinkProps has no disabled prop'}else{'required'}}
  try{
   Command 'action-case' $spec.source|Out-Null
   $name=$spec.label+' 0'
   $control=Check-PeerFrame (Capture ($spec.source+'-before-input')) $spec.source $name $spec.type ($spec.source+'-before-input')
   Focus-Action $name $spec.type
   Exactly-Once $spec.source 'Enter' {Key 13}
   if($spec.source -ne 'link'){Exactly-Once $spec.source 'Space' {Key 32}}
   Exactly-Once $spec.source 'mouse' {Click-Control $control}
   Exactly-Once $spec.source 'Invoke' {$result=Uia-Action 'invoke' $name $spec.type;Assert ($result.status -eq 'completed') 'Native Invoke accepted' $result}
   Command 'revision' 1|Out-Null
   Status-Contains 'revision=1 mounted=true'
   $updatedName=$spec.label+' 1'
   $updatedTree=Capture ($spec.source+'-updated')
   Action-Shape $updatedTree $updatedName $spec.type|Out-Null
   Assert (@($updatedTree|Where-Object {$_.name -ceq $name -and $_.type -ceq $spec.type}).Count -eq 0) 'Updated name replaces the previous action name'
   Exactly-Once $spec.source 'updated Invoke' {$result=Uia-Action 'invoke' $updatedName $spec.type;Assert ($result.status -eq 'completed') 'Updated Invoke accepted' $result}
   Command 'mounted' $false|Out-Null
   Status-Contains 'mounted=false'
   $absent=Capture ($spec.source+'-unmounted')
   Assert (@($absent|Where-Object {$_.type -in @('ControlType.Button','ControlType.Hyperlink') -and $_.name -in @($name,$updatedName)}).Count -eq 0) 'Unmount removes the native action peer'
   Command 'revision' 0|Out-Null
   Command 'mounted' $true|Out-Null
   Status-Contains 'revision=0 mounted=true'
   Action-Shape (Capture ($spec.source+'-remounted')) $name $spec.type|Out-Null
   Exactly-Once $spec.source 'remounted Invoke' {$result=Uia-Action 'invoke' $name $spec.type;Assert ($result.status -eq 'completed') 'Remounted Invoke accepted' $result}
   if($spec.source -ne 'link'){
    Focus-Action $name $spec.type
    Command 'disabled' $true|Out-Null
    $disabledTree=Capture ($spec.source+'-disabled')
    $disabledControl=@($disabledTree|Where-Object {$_.name -ceq $name -and $_.type -ceq $spec.type})
    Assert ($disabledControl.Count -eq 1 -and -not $disabledControl[0].enabled) 'Disabled native peer reports IsEnabled=false'
    $before=Activations $spec.source
    $focus=Uia-Action 'focus' $name $spec.type
    Assert (-not $focus.targetFocused) 'Disabled peer rejects focus' $focus
    No-Activation $spec.source 'Enter' {Key 13}
    No-Activation $spec.source 'Space' {Key 32}
    $invoke=Uia-Action 'invoke' $name $spec.type
    Assert ($invoke.status -eq 'rejected') 'Disabled peer rejects Invoke' $invoke
    No-Activation $spec.source 'mouse' {Click-Control $disabledControl[0]}
    Assert ((Activations $spec.source) -eq $before) 'No disabled input activates the isolated action'
    Key 9
    Assert (-not (Focused $name)) 'Physical Tab skips the disabled action'
    Key 9 $true
    Assert (-not (Focused $name)) 'Physical Shift+Tab skips the disabled action'
    Command 'disabled' $false|Out-Null
    Action-Shape (Capture ($spec.source+'-reenabled')) $name $spec.type|Out-Null
    Focus-Action $name $spec.type
    Exactly-Once $spec.source 'reenabled Enter' {Key 13}
    Command 'implicit-names' $true|Out-Null
    $implicit=$spec.label+' content 0'
    Action-Shape (Capture ($spec.source+'-implicit')) $implicit $spec.type|Out-Null
    Command 'revision' 1|Out-Null
    $implicit=$spec.label+' content 1'
    Action-Shape (Capture ($spec.source+'-implicit-updated')) $implicit $spec.type|Out-Null
    Exactly-Once $spec.source 'implicit-name Invoke' {$result=Uia-Action 'invoke' $implicit $spec.type;Assert ($result.status -eq 'completed') 'Implicit-name Invoke accepted' $result}
    Command 'revision' 0|Out-Null
    Command 'implicit-names' $false|Out-Null
   }
   $wide=Check-PeerFrame (Capture ($spec.source+'-wide')) $spec.source $name $spec.type ($spec.source+'-wide')
   if(-not [Core20Desktop]::MoveWindow($windowHandle,$left,$top,$narrowWidth,$height,$true)){throw 'Cannot narrow the action window'}
   $narrow=Check-PeerFrame (Capture ($spec.source+'-narrow')) $spec.source $name $spec.type ($spec.source+'-narrow')
   Assert ($narrow.width -lt $wide.width) 'Action peer and drawing shrink together on resize' @{wide=$wide.width;narrow=$narrow.width}
   if(-not [Core20Desktop]::MoveWindow($windowHandle,$left,$top,$wideWidth,$height,$true)){throw 'Cannot restore wide action window'}
   Action-Shape (Capture ($spec.source+'-wide-restored')) $name $spec.type|Out-Null
   if($spec.source -eq 'link'){
    foreach($method in @('Enter','mouse','Invoke')){
     Command 'routed-link' $true|Out-Null
     Wait-For {@(Read-Tree|Where-Object {$_.name -ceq 'Destination /'}).Count -eq 1} 'Navigation did not reset to its initial destination'
     $routedControl=Action-Shape (Capture ('link-routed-'+$method)) $name $spec.type
     $beforeNavigation=@(Read-Events|Where-Object {$_.bootId -eq $script:Boot.bootId -and $_.event -eq 'navigation'}).Count
     Focus-Action $name $spec.type
     Exactly-Once 'link' ('routed '+$method) {
      switch($method){
       'Enter'{Key 13}
       'mouse'{Click-Control $routedControl}
       'Invoke'{$result=Uia-Action 'invoke' $name $spec.type;Assert ($result.status -eq 'completed') 'Routed Invoke accepted' $result}
      }
     }
     Wait-For {@(Read-Tree|Where-Object {$_.name -ceq 'Destination /details'}).Count -eq 1} 'Link did not reach its navigation callback destination'
     $navigations=@(Read-Events|Where-Object {$_.bootId -eq $script:Boot.bootId -and $_.event -eq 'navigation'})
     Assert ($navigations.Count -eq $beforeNavigation+1 -and $navigations[-1].href -ceq '/details') "Link $method calls its injected navigation callback exactly once with href" $navigations[-1]
    }
   }
   $entry.status='assertions-passed'
  }catch{$entry.status='failed';$entry.error=$_.Exception.Message}
  finally{
   $entry.checks=@($script:Checks.ToArray());$script:Cases.Add([pscustomobject]$entry);Save-CaseProgress
   Command 'disabled' $false|Out-Null
   Command 'implicit-names' $false|Out-Null
   Command 'revision' 0|Out-Null
   Command 'mounted' $true|Out-Null
   Command 'routed-link' $false|Out-Null
   [Core20Desktop]::MoveWindow($windowHandle,$left,$top,$wideWidth,$height,$true)|Out-Null
  }
 }
 }
 if(@($script:Cases|Where-Object {$_.status -ne 'assertions-passed'}).Count -gt 0){throw 'Action input checks failed; inspect result.json'}
 $report.qualification='pending-completion-audit'
} catch {
 $report.error=$_.Exception.Message
 if($script:Cases.Count -eq 0){$report.preflightChecks=@($script:Checks.ToArray())}
 } finally {
 $cleanupErrors=[Collections.Generic.List[string]]::new()
 if(-not [Core20ActionInput]::SetCursorPos($savedCursor.X,$savedCursor.Y)){$cleanupErrors.Add('Cannot restore pointer position')}
 try {
  if($original -and $process -and -not $process.HasExited){
   if(-not [Core20Desktop]::MoveWindow($process.MainWindowHandle,$original.Left,$original.Top,$original.Right-$original.Left,$original.Bottom-$original.Top,$true)){
    $cleanupErrors.Add('Could not restore the owned window position')
   }
  }
 }catch{$cleanupErrors.Add($_.Exception.Message)}
 try {
  if($script:LogPath -and (Test-Path $script:LogPath)){Copy-Item $script:LogPath (Join-Path $OutputDirectory 'console.log')}
 }catch{$cleanupErrors.Add($_.Exception.Message)}
 try {
  Get-Process windows -ErrorAction SilentlyContinue|Where-Object {$_.Path -and $_.Path.StartsWith($pkg.InstallLocation,[StringComparison]::OrdinalIgnoreCase)}|Stop-Process
 }catch{$cleanupErrors.Add($_.Exception.Message)}
 [Core20Desktop]::SetThreadDpiAwarenessContext($previousDpi)|Out-Null
 $report.cleanupErrors=@($cleanupErrors.ToArray())
 if($cleanupErrors.Count -gt 0 -and -not $report.error){$report.error='Cleanup failed; inspect cleanupErrors'}
 $report|ConvertTo-Json -Depth 12|Set-Content (Join-Path $OutputDirectory 'result.json') -Encoding UTF8
}
if($report.error){Write-Error $report.error;exit 1}
Write-Output "Evidence collected for $($script:Cases.Count) cases; completion audit pending."
