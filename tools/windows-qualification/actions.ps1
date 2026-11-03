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
 [switch]$SelectorActions,
 [switch]$MenuActions,
 [switch]$TableActions,
 [switch]$LayerActions,
 [switch]$LayerFocusActions,
 [switch]$Core20Structure,
 [switch]$ServiceActions,
 [string[]]$ServiceSpecs='',
 [switch]$TextInputActions,
 [switch]$ScrollActions
)
$ErrorActionPreference='Stop'
if(([int][bool]$DisplayActions + [int][bool]$ListItemActions + [int][bool]$TabActions + [int][bool]$SelectorActions + [int][bool]$MenuActions + [int][bool]$TableActions + [int][bool]$LayerActions + [int][bool]$LayerFocusActions + [int][bool]$Core20Structure + [int][bool]$ServiceActions + [int][bool]$TextInputActions + [int][bool]$ScrollActions) -gt 1){throw 'Choose one action mode per run'}
if(@($ServiceSpecs|Where-Object {$_}).Count -gt 0 -and -not $ServiceActions){throw 'ServiceSpecs requires ServiceActions'}
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
 Wait-For { @(Read-Tree|Where-Object {$_.name -and $_.name.StartsWith('Core20 ') -and $_.name.Contains($Text)}).Count -eq 1 } "UIA status never reached $Text"
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
function Native-Find($Nodes,[string]$Id){
 $found=@($Nodes|Where-Object {$_.id -ceq $Id})
 return $(if($found.Count){$found[0]}else{$null})
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
 public static void Down(ushort code) {
  Send(new[]{new Input {Type=1,Data=new Union {Key=new Key {Code=code}}}});
 }
 public static void Up(ushort code) {
  Send(new[]{new Input {Type=1,Data=new Union {Key=new Key {Code=code,Flags=2}}}});
 }
 public static void Type(string text) {
  var inputs=new System.Collections.Generic.List<Input>();
  foreach(char c in text){
   inputs.Add(new Input {Type=1,Data=new Union {Key=new Key {Code=0,Scan=(ushort)c,Flags=4}}});
   inputs.Add(new Input {Type=1,Data=new Union {Key=new Key {Code=0,Scan=(ushort)c,Flags=6}}});
  }
  Send(inputs.ToArray());
 }
 public static void Wheel(int delta) {
  Send(new[]{new Input {Type=0,Data=new Union {Mouse=new Mouse {Flags=0x800,Data=(uint)delta}}}});
 }
 public static void Move(int x,int y) {
  if(!SetCursorPos(x,y)) throw new Exception("SetCursorPos failed");
 }
 public static void Click(int x,int y) {
  if(!SetCursorPos(x,y)) throw new Exception("SetCursorPos failed");
  Send(new[]{new Input {Type=0,Data=new Union {Mouse=new Mouse {Flags=2}}},new Input {Type=0,Data=new Union {Mouse=new Mouse {Flags=4}}}});
 }
}
'@
$script:ActionCount=0
function Uia-Action([string]$Operation,[string]$Name='',[string]$Type='',$Extra=$null){
 $script:ActionCount++
 $directory=Join-Path $OutputDirectory ('uia-actions/'+$script:ActionCount.ToString('D4'))
 New-Item -ItemType Directory -Path $directory -Force|Out-Null
 $prefix=Join-Path $directory 'action'
 $requestPath=Join-Path $directory 'request.json'
 $request=[ordered]@{windowHandle=$script:WindowHandle.ToInt64();expectedProcessId=$script:AppProcessId;operation=$Operation;name=$Name;controlType=$Type}
 if($null -ne $Extra){foreach($key in $Extra.Keys){$request[$key]=$Extra[$key]}}
 $request|ConvertTo-Json|Set-Content $requestPath -Encoding UTF8
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
 $foreground=[Core20ActionInput]::GetForegroundWindow()
 [uint32]$owner=0
 [Core20Desktop]::GetWindowThreadProcessId($foreground,[ref]$owner)|Out-Null
 $before=[ordered]@{window=$foreground.ToInt64();processId=$owner}
 # Native popups can own foreground without using the main window's HWND.
 # Focusing the main HWND in that state can dismiss the popup before input.
 if($owner -ne $script:AppProcessId){
  [Core20Desktop]::SetForegroundWindow($script:WindowHandle)|Out-Null
  $foreground=[Core20ActionInput]::GetForegroundWindow()
  [Core20Desktop]::GetWindowThreadProcessId($foreground,[ref]$owner)|Out-Null
 }
 $record=@{before=$before;foregroundWindow=$foreground.ToInt64();foregroundProcessId=$owner;expectedProcessId=$script:AppProcessId;mainWindow=$script:WindowHandle.ToInt64()}
 [IO.File]::AppendAllText((Join-Path $OutputDirectory 'input-owners.jsonl'),(($record|ConvertTo-Json -Compress)+[Environment]::NewLine))
 if($owner -ne $script:AppProcessId){throw 'Owned process is not foreground; refusing input'}
}
function Key([int]$Code,[bool]$Shift=$false){Input-Owner;[Core20ActionInput]::Press($Code,$Shift)}
function Key-Down([int]$Code){Input-Owner;[Core20ActionInput]::Down([uint16]$Code)}
function Key-Up([int]$Code){Input-Owner;[Core20ActionInput]::Up([uint16]$Code)}
function Type-Text([string]$Text){Input-Owner;[Core20ActionInput]::Type($Text)}
function Mouse-Wheel([int]$Delta){Input-Owner;[Core20ActionInput]::Wheel($Delta)}
function Mouse-Move([int]$X,[int]$Y){Input-Owner;[Core20ActionInput]::Move($X,$Y)}
function Click-Control($Control){
 Input-Owner
 [Core20ActionInput]::Click([int]($Control.x+$Control.width/2),[int]($Control.y+$Control.height/2))
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
function Reset-Table([int]$Revision=0){
 Command 'mounted' $false|Out-Null
 Command 'revision' $Revision|Out-Null
 Command 'disabled' $false|Out-Null
 Command 'scene' 'table'|Out-Null
 Command 'mounted' $true|Out-Null
 Status-Contains 'Core20 table '
 Status-Contains ("revision=$Revision mounted=true")
}
function Table-Header([int]$Revision,[string]$Stage,[string]$Direction='unsorted'){
 $tree=Capture $Stage
 $label=if($Direction -eq 'unsorted'){"Sort by Name $Revision"}else{"Sorted by Name $Revision $Direction"}
 $peer=Named @($tree|Where-Object {$_.type -eq 'ControlType.Button'}) $label
 Assert (Finite $peer) 'Sortable header Button has finite visible bounds' $peer
 Assert ($peer.patterns -contains 'InvokePatternIdentifiers.Pattern') 'Sortable header exposes Invoke' $peer.patterns
 Assert $peer.enabled 'Sortable header reports IsEnabled=true' $peer.enabled
 $nodes=Snapshot ($Stage+'-content')
 $drawn=Native-Class $nodes 'vx-table-sort-button'
 Assert ((Near ($peer.x/$script:Scale) $drawn.box.x) -and (Near ($peer.y/$script:Scale) $drawn.box.y) -and (Near $peer.width $drawn.box.width) -and (Near $peer.height $drawn.box.height)) 'Sortable header peer covers its drawn frame' @{peer=$peer;drawn=$drawn.box}
 return $peer
}
function Table-State([string]$Direction){
 $needle=if($Direction -eq 'unsorted'){'Table sort []'}else{'direction":"'+$Direction}
 Wait-For { @(Read-Tree|Where-Object {$_.name -and $_.name.StartsWith('Table sort ') -and $_.name.Contains($needle)}).Count -eq 1 } "UIA table state never reached $Direction"
}
function Check-TableSortActions {
 $script:Checks.Clear()
 $entry=[ordered]@{case='public-table-sortable-header';status='running';checks=$null;error=$null}
 try{
  Reset-Table
  $peer=Table-Header 0 'table-initial' 'unsorted'
  Focus-Action 'Before table' 'ControlType.Button';Key 9
  Wait-For {Focused 'Sort by Name 0'} 'Tab did not focus the sortable header'
  Key 9;Wait-For {Focused 'After table'} 'Tab did not leave the sortable header after one stop'
  Assert $true 'Sortable header contributes one forward Tab stop'
  Key 9 $true;Wait-For {Focused 'Sort by Name 0'} 'Shift+Tab did not return to the sortable header'
  Exactly-Once 'table-sort:[{"sortKey":"name","direction":"ascending"}]' 'header Enter' {Key 13}
  Table-State 'ascending';Table-Header 0 'table-enter-asc' 'ascending'|Out-Null
  Exactly-Once 'table-sort:[{"sortKey":"name","direction":"descending"}]' 'header Enter desc' {Key 13}
  Table-State 'descending';Table-Header 0 'table-enter-desc' 'descending'|Out-Null
  Exactly-Once 'table-sort:[]' 'header Enter unsorted' {Key 13}
  Table-State 'unsorted';Table-Header 0 'table-enter-none' 'unsorted'|Out-Null
  Exactly-Once 'table-sort:[{"sortKey":"name","direction":"ascending"}]' 'header Space' {Key 32}
  Table-State 'ascending'
  Exactly-Once 'table-sort:[{"sortKey":"name","direction":"descending"}]' 'header mouse' {Click-Control $peer}
  Table-State 'descending'
  $result=Uia-Action 'invoke' 'Sorted by Name 0 descending' 'ControlType.Button'
  Assert ($result.status -eq 'completed') 'UIA Invoke on the sortable header completed' $result
  Table-State 'unsorted';Table-Header 0 'table-invoke-none' 'unsorted'|Out-Null
  $events=@(Read-Events|Where-Object {$_.bootId -eq $script:Boot.bootId -and $_.event -eq 'activation' -and $_.source -like 'table-sort:*'})
  Assert ($events[-1].fixtureRevision -eq 0) 'Sort callback reports the current fixture revision' $events[-1]
  Command 'revision' 1|Out-Null
  Table-Header 1 'table-updated' 'unsorted'|Out-Null
  Focus-Action 'Sort by Name 1' 'ControlType.Button';Exactly-Once 'table-sort:[{"sortKey":"name","direction":"ascending"}]' 'updated Enter' {Key 13}
  Table-State 'ascending'
  Command 'revision' 2|Out-Null
  Wait-For { @(Read-Tree|Where-Object {$_.name -ceq 'Sort by Name 2'}).Count -eq 1 } 'Revision 2 header never appeared'
  Focus-Action 'Sort by Name 2' 'ControlType.Button'
  $before=@(Read-Events|Where-Object {$_.bootId -eq $script:Boot.bootId -and $_.event -eq 'activation' -and $_.source -like 'table-sort:*'}).Count
  Exactly-Once 'table-sort:[{"sortKey":"name","direction":"ascending"}]' 'controlled rejection Enter' {Key 13}
  Table-State 'unsorted';Table-Header 2 'table-rejected' 'unsorted'|Out-Null
  Command 'mounted' $false|Out-Null
  $absent=Capture 'table-unmounted'
  Assert (@($absent|Where-Object {$_.name -like 'Sort*by Name*'}).Count -eq 0) 'Unmount removes the sortable header peer'
  Reset-Table
  Table-Header 0 'table-remounted' 'unsorted'|Out-Null
  Focus-Action 'Sort by Name 0' 'ControlType.Button';Exactly-Once 'table-sort:[{"sortKey":"name","direction":"ascending"}]' 'remounted Enter' {Key 13}
  Table-State 'ascending'
  if(-not [Core20Desktop]::MoveWindow($script:WindowHandle,$left,$top,$narrowWidth,$height,$true)){throw 'Cannot narrow the owned Table window'}
  Table-Header 0 'table-narrow' 'ascending'|Out-Null
  $entry.status='assertions-passed'
 }catch{
  $entry.status='failed'
  $entry.error=$_.Exception.Message
 }finally{
  $entry.checks=@($script:Checks.ToArray());$script:Cases.Add([pscustomobject]$entry)
 }
}
function Reset-Layer([int]$Revision=0){
 Command 'mounted' $false|Out-Null
 Command 'revision' $Revision|Out-Null
 Command 'disabled' $false|Out-Null
 Command 'scene' 'layer'|Out-Null
 Command 'mounted' $true|Out-Null
 Status-Contains 'Core20 layer '
 Status-Contains ("revision=$Revision mounted=true")
}
function Layer-State([bool]$Open){
 Wait-For { @(Read-Tree|Where-Object {$_.name -ceq ('Layer open='+$Open.ToString().ToLowerInvariant())}).Count -eq 1 } "UIA layer state never reached open=$Open"
}
function Layer-OpenRequests([bool]$Open){
 return @(Read-Events|Where-Object {$_.bootId -eq $script:Boot.bootId -and $_.event -eq 'layer-open-change' -and $_.source -eq 'layer' -and $_.open -eq $Open}).Count
}
function Layer-Surface([int]$Revision,[string]$Stage){
 $tree=Capture $Stage
 $surface=Named $tree ("Layer content $Revision")
 Assert (Finite $surface) 'Anchored layer surface has finite visible bounds' $surface
 $content=Named $tree ("Anchored content $Revision")
 Assert (Finite $content) 'Anchored layer text content has finite visible bounds' $content
 $action=Named @($tree|Where-Object {$_.type -eq 'ControlType.Button'}) ("Layer action $Revision")
 Assert (Finite $action) 'Layer action Button has finite visible bounds' $action
 Assert ($action.patterns -contains 'InvokePatternIdentifiers.Pattern') 'Layer action exposes Invoke' $action.patterns
 Named @($tree|Where-Object {$_.type -eq 'ControlType.Button'}) 'Close layer'|Out-Null
 $nodes=Snapshot ($Stage+'-native')
 $drawn=Native-Id $nodes 'core20-layer-content'
 Assert ((Near ($surface.x/$script:Scale) $drawn.box.x) -and (Near ($surface.y/$script:Scale) $drawn.box.y)) 'Layer surface peer covers its drawn frame origin' @{peer=$surface;drawn=$drawn.box}
 $trigger=Native-Id $nodes 'core20-layer-trigger'
 Assert ($drawn.box.y -ge $trigger.box.y+$trigger.box.height-1) 'Anchored layer opens below its trigger' @{layer=$drawn.box;trigger=$trigger.box}
 return @{tree=$tree;surface=$surface;action=$action}
}
function Layer-Absent([string]$Stage){
 $tree=Capture $Stage
 Assert (@($tree|Where-Object {$_.name -like 'Layer content*'}).Count -eq 0) 'Closed layer removes its surface peer'
 Assert (@($tree|Where-Object {$_.name -like 'Layer action*'}).Count -eq 0) 'Closed layer removes its action peer'
 return $tree
}
function Check-LayerActions {
 $script:Checks.Clear()
 $entry=[ordered]@{case='public-layer-anchored';status='running';checks=$null;error=$null}
 try{
  Reset-Layer
  $tree=Capture 'layer-initial'
  $trigger=Named @($tree|Where-Object {$_.type -eq 'ControlType.Button'}) 'Details 0'
  Assert (Finite $trigger) 'Layer trigger has finite visible bounds' $trigger
  Layer-Absent 'layer-closed-initial'|Out-Null
  Layer-State $false
  $requests=Layer-OpenRequests $true
  Focus-Action 'Details 0' 'ControlType.Button';Key 13
  Layer-State $true
  Assert ((Layer-OpenRequests $true) -eq $requests+1) 'Trigger Enter requests the layer exactly once'
  $open=Layer-Surface 0 'layer-opened'
  Focus-Action 'Layer action 0' 'ControlType.Button'
  Exactly-Once 'layer-content' 'layer action Enter' {Key 13}
  $events=@(Read-Events|Where-Object {$_.bootId -eq $script:Boot.bootId -and $_.event -eq 'activation' -and $_.source -eq 'layer-content'})
  Assert ($events[-1].fixtureRevision -eq 0) 'Layer action reports the current fixture revision' $events[-1]
  Layer-State $true
  $close=Named @($open.tree|Where-Object {$_.type -eq 'ControlType.Button'}) 'Close layer'
  Focus-Action 'Close layer' 'ControlType.Button';Key 13
  Layer-State $false;Layer-Absent 'layer-close-button'|Out-Null
  Assert ((Layer-OpenRequests $false) -ge 1) 'Close button reports one layer close'
  Wait-For {Focused 'Before layer'} 'Closing did not return focus inside the declaring window'
  $requests=Layer-OpenRequests $true
  Focus-Action 'Details 0' 'ControlType.Button';Key 13
  Layer-State $true;Layer-Surface 0 'layer-reopened'|Out-Null
  $outside=Named @((Capture 'layer-outside-target')|Where-Object {$_.type -eq 'ControlType.Button'}) 'Before layer'
  $probe=Uia-Action 'point' '' '' ([ordered]@{x=[int]($outside.x+$outside.width/2);y=[int]($outside.y+$outside.height/2);probe='layer-outside-point'})
  Assert ($null -ne $probe) 'Outside point probe ran' $probe
  Click-Control $outside
  Layer-State $false;Layer-Absent 'layer-outside-dismiss'|Out-Null
  Assert ((Layer-OpenRequests $false) -ge 2) 'Outside dismissal reports one layer close'
  $requests=Layer-OpenRequests $true
  Focus-Action 'Details 0' 'ControlType.Button';Key 13
  Layer-State $true;Layer-Surface 0 'layer-escape-open'|Out-Null
  Key 27
  Layer-State $false;Layer-Absent 'layer-escape-dismiss'|Out-Null
  Assert ((Layer-OpenRequests $false) -ge 3) 'Escape reports one layer close'
  Wait-For {Focused 'Details 0'} 'Escape did not return focus inside the declaring window'
  $requests=Layer-OpenRequests $true
  Click-Control $trigger
  Layer-State $true
  Assert ((Layer-OpenRequests $true) -eq $requests+1) 'Trigger mouse click opens the layer once'
  Command 'revision' 1|Out-Null
  Layer-State $true
  Layer-Surface 1 'layer-updated'|Out-Null
  $close1=Named @((Capture 'layer-updated-close')|Where-Object {$_.type -eq 'ControlType.Button'}) 'Close layer'
  Click-Control $close1
  Layer-State $false
  Reset-Layer 2
  $requests=Layer-OpenRequests $true
  Focus-Action 'Details 2' 'ControlType.Button';Key 13
  Assert ((Layer-OpenRequests $true) -eq $requests+1) 'Controlled rejection still reports the open request'
  Layer-State $false
  Assert (@((Capture 'layer-rejected')|Where-Object {$_.name -like 'Layer content*'}).Count -eq 0) 'Controlled isOpen rejection keeps the surface absent'
  Command 'disabled' $true|Out-Null
  $disabledTree=Capture 'layer-disabled'
  $disabled=Named @($disabledTree|Where-Object {$_.type -eq 'ControlType.Button'}) 'Details 2'
  Assert (-not $disabled.enabled) 'Disabled trigger reports IsEnabled=false' $disabled.enabled
  $before=Layer-OpenRequests $true
  Click-Control $disabled
  Start-Sleep -Milliseconds 500
  Assert ((Layer-OpenRequests $true) -eq $before) 'Disabled trigger does not request the layer'
  Command 'mounted' $false|Out-Null
  $absent=Capture 'layer-unmounted'
  Assert (@($absent|Where-Object {$_.name -like 'Details*'}).Count -eq 0) 'Unmount removes the layer trigger peer'
  Reset-Layer
  $requests=Layer-OpenRequests $true
  Focus-Action 'Details 0' 'ControlType.Button';Key 13
  Layer-State $true
  Layer-Surface 0 'layer-remounted'|Out-Null
  if(-not [Core20Desktop]::MoveWindow($script:WindowHandle,$left,$top,$narrowWidth,$height,$true)){throw 'Cannot narrow the owned layer window'}
  $narrowTree=Capture 'layer-narrow'
  $narrowSurface=Named $narrowTree 'Layer content 0'
  Assert (Finite $narrowSurface) 'Narrowed window keeps the layer surface finite' $narrowSurface
  $entry.status='assertions-passed'
 }catch{
  $entry.status='failed'
  $entry.error=$_.Exception.Message
 }finally{
  $entry.checks=@($script:Checks.ToArray());$script:Cases.Add([pscustomobject]$entry)
 }
}
function Nested-State([bool]$Outer,[bool]$Inner){
 Wait-For { @(Read-Tree|Where-Object {$_.name -ceq ('Nested outer='+$Outer.ToString().ToLowerInvariant()+' inner='+$Inner.ToString().ToLowerInvariant())}).Count -eq 1 } "UIA nested state never reached outer=$Outer inner=$Inner"
}
function Check-LayerFocusActions {
 $script:Checks.Clear()
 $entry=[ordered]@{case='public-layer-nested-focus';status='running';checks=$null;error=$null}
 try{
  Command 'mounted' $false|Out-Null
  Command 'revision' 0|Out-Null
  Command 'disabled' $false|Out-Null
  Command 'scene' 'nested-layer'|Out-Null
  Command 'mounted' $true|Out-Null
  Status-Contains 'Core20 nested-layer '
  Status-Contains 'revision=0 mounted=true'
  Nested-State $false $false
  $outer=Named @((Capture 'nested-initial')|Where-Object {$_.type -eq 'ControlType.Button'}) 'Outer layer 0'
  Focus-Action 'Outer layer 0' 'ControlType.Button';Key 13
  Nested-State $true $false
  $tree=Capture 'nested-outer-open'
  Named @($tree|Where-Object {$_.name -eq 'Outer layer content 0'}) 'Outer layer content 0'|Out-Null
  $innerTrigger=Named @($tree|Where-Object {$_.type -eq 'ControlType.Button'}) 'Inner layer 0'
  Focus-Action 'Inner layer 0' 'ControlType.Button';Key 13
  Nested-State $true $true
  $innerTree=Capture 'nested-inner-open'
  Named @($innerTree|Where-Object {$_.name -eq 'Inner layer content 0'}) 'Inner layer content 0'|Out-Null
  Key 27
  Nested-State $true $false
  Assert (@((Capture 'nested-inner-escape')|Where-Object {$_.name -eq 'Inner layer content 0'}).Count -eq 0) 'Escape closes only the topmost layer'
  $focusInner=Focused 'Inner layer 0'
  Assert ($focusInner) 'Escape closed child did not return focus inside the parent layer'
  Focus-Action 'Close outer' 'ControlType.Button';Key 13
  Nested-State $false $false
  Assert (@((Capture 'nested-outer-closed')|Where-Object {$_.name -like '*layer content*'}).Count -eq 0) 'Closing the parent removes both surfaces'
  $focusOuter=Focused 'Before nested'
  Assert ($focusOuter) 'Closing the parent did not return focus inside the declaring window'
  $outer2=Named @((Capture 'nested-reopen')|Where-Object {$_.type -eq 'ControlType.Button'}) 'Outer layer 0'
  Focus-Action 'Outer layer 0' 'ControlType.Button';Key 13
  Nested-State $true $false
  Focus-Action 'Inner layer 0' 'ControlType.Button';Key 13
  Nested-State $true $true
  Key 27
  Nested-State $true $false
  Assert (@((Capture 'nested-inner-escape2')|Where-Object {$_.name -eq 'Inner layer content 0'}).Count -eq 0) 'Second Escape closes only the topmost layer'
  $focusInner2=Focused 'Inner layer 0'
  Assert ($focusInner2) 'Second Escape did not return focus inside the parent layer'
  Key 27
  Nested-State $false $false
  Assert (@((Capture 'nested-outer-escape')|Where-Object {$_.name -like '*layer content*'}).Count -eq 0) 'Third Escape closes the parent'
  $focusOuter2=Focused 'Before nested'
  Assert ($focusOuter2) 'Third Escape did not return focus inside the declaring window'
  $entry.status='assertions-passed'
 }catch{
  $entry.status='failed'
  $entry.error=$_.Exception.Message
 }finally{
  $entry.checks=@($script:Checks.ToArray());$script:Cases.Add([pscustomobject]$entry)
 }
}
function Check-DisplayStructure([string]$Case,[string]$Prefix,$Tree,$Nodes){
 $labels=@{card='Card';badge='Badge';avatar='Avatar';banner='Banner'}
 $id="core20-$Case"
 $root=Native-Id $Nodes $id
 Assert ($null -ne $root) "$Case renders its native drawing node" $id
 if($Case -eq 'card'){
  Named $Tree ('Card header 0')|Out-Null
  Named $Tree ('Card body 0: a longer sentence that wraps when the window becomes narrow.')|Out-Null
  Named $Tree ('Card footer 0')|Out-Null
  Named @($Tree|Where-Object {$_.type -eq 'ControlType.Button'}) 'Open card 0'|Out-Null
 }elseif($Case -eq 'badge'){
  Named $Tree 'Ready badge'|Out-Null
 }elseif($Case -eq 'avatar'){
  Named @($Tree|Where-Object {$_.type -eq 'ControlType.Image'}) 'Ada Lovelace'|Out-Null
  Named $Tree 'AL'|Out-Null
 }elseif($Case -eq 'banner'){
  Named @($Tree|Where-Object {$_.type -eq 'ControlType.Button'}) 'Banner action 0'|Out-Null
  Named $Tree ('Banner body 0')|Out-Null
 }
}
function Check-Core20Structure {
 $layoutCases=@('text','vstack','hstack','stack','view','center','section','shrink')
 $displayCases=@('card','badge','avatar','banner')
 foreach($Case in $layoutCases){
  $script:Checks.Clear()
  $entry=[ordered]@{case='layout-'+$Case;status='running';checks=$null;error=$null}
  try{
   Command 'mounted' $false|Out-Null
   Command 'revision' 0|Out-Null
   Command 'disabled' $false|Out-Null
   Command 'scene' 'layout'|Out-Null
   Command 'case' $Case|Out-Null
   Command 'mounted' $true|Out-Null
   Status-Contains 'Core20 layout '
   Status-Contains ('case='+$Case)
   $tree=Capture ('layout-'+$Case+'-wide')
   $nodes=Snapshot ('layout-'+$Case+'-native')
   Check-Layout $Case $tree $nodes
   if(-not [Core20Desktop]::MoveWindow($script:WindowHandle,$left,$top,$narrowWidth,$height,$true)){throw 'Cannot narrow the owned layout window'}
   $tree2=Capture ('layout-'+$Case+'-narrow')
   $nodes2=Snapshot ('layout-'+$Case+'-narrow-native')
   if($Case -ne 'shrink'){Check-Reflow $Case $tree2 $nodes2}
   if(-not [Core20Desktop]::MoveWindow($script:WindowHandle,$left,$top,$wideWidth,$height,$true)){throw 'Cannot restore the owned layout window'}
   Command 'revision' 1|Out-Null
   $tree3=Capture ('layout-'+$Case+'-rev1')
   Assert (@($tree3).Count -gt 0) 'Layout revision update re-renders'
   Command 'mounted' $false|Out-Null
   Command 'mounted' $true|Out-Null
   $tree4=Capture ('layout-'+$Case+'-remount')
   Assert (@($tree4).Count -gt 0) 'Layout remount re-renders'
   $entry.status='assertions-passed'
  }catch{$entry.status='failed';$entry.error=$_.Exception.Message}
  finally{$entry.checks=@($script:Checks.ToArray());$script:Cases.Add([pscustomobject]$entry);Save-CaseProgress}
 }
 $script:Checks.Clear()
 $entry=[ordered]@{case='list-structure';status='running';checks=$null;error=$null}
 try{
  Command 'mounted' $false|Out-Null
  Command 'revision' 0|Out-Null
  Command 'disabled' $false|Out-Null
  Command 'scene' 'collections'|Out-Null
  Command 'mounted' $true|Out-Null
  Status-Contains 'Core20 collections '
  $tree=Capture 'list-structure-wide'
  $list=Named $Tree 'Rows 0'
  Assert (($list.type -in @('ControlType.Group','ControlType.List')) -and (Finite $list)) 'List exposes a named accessible peer with visible bounds' $list.type
  $first=Named @($Tree|Where-Object {$_.type -eq 'ControlType.Group'}) 'First row 0'
  $open=Named @($Tree|Where-Object {$_.type -eq 'ControlType.Button'}) 'Open row 0'
  Assert ((Finite $first) -and (Finite $open)) 'List rows have visible UIA peers and bounds'
  Assert ($open.y -gt $first.y) 'List rows are vertically ordered without overlap' @{first=$first.y;open=$open.y}
  $leading=Named $Tree 'Leading'
  $trailing=Named $Tree 'Trailing'
  Assert ((Finite $leading) -and (Finite $trailing) -and ($leading.x -lt $trailing.x)) 'ListItem exposes ordered leading and trailing slot content' @{leading=$leading.x;trailing=$trailing.x}
  Command 'revision' 1|Out-Null
  $tree2=Capture 'list-structure-rev1'
  Named $tree2 'Rows 1'|Out-Null
  Named @($tree2|Where-Object {$_.type -eq 'ControlType.Group'}) 'First row 1'|Out-Null
  Assert (@($tree2|Where-Object {$_.name -ceq 'Rows 0'}).Count -eq 0) 'List prop update replaces its accessible name'
  Command 'mounted' $false|Out-Null
  Command 'mounted' $true|Out-Null
  $tree3=Capture 'list-structure-remount'
  Named $tree3 'Rows 1'|Out-Null
  $entry.status='assertions-passed'
 }catch{$entry.status='failed';$entry.error=$_.Exception.Message}
 finally{$entry.checks=@($script:Checks.ToArray());$script:Cases.Add([pscustomobject]$entry);Save-CaseProgress}
 foreach($Case in $displayCases){
  $script:Checks.Clear()
  $entry=[ordered]@{case='display-'+$Case;status='running';checks=$null;error=$null}
  try{
   Command 'mounted' $false|Out-Null
   Command 'revision' 0|Out-Null
   Command 'disabled' $false|Out-Null
   Command 'scene' 'display'|Out-Null
   Command 'display-case' $Case|Out-Null
   Command 'mounted' $true|Out-Null
   Status-Contains 'Core20 display '
   $tree=Capture ('display-'+$Case+'-wide')
   $nodes=Snapshot ('display-'+$Case+'-native')
   Check-DisplayStructure $Case ('display-'+$Case) $tree $nodes
   Command 'revision' 1|Out-Null
   $tree3=Capture ('display-'+$Case+'-rev1')
   Assert (@($tree3).Count -gt 0) 'Display revision update re-renders'
   Command 'mounted' $false|Out-Null
   Command 'mounted' $true|Out-Null
   $tree4=Capture ('display-'+$Case+'-remount')
   Assert (@($tree4).Count -gt 0) 'Display remount re-renders'
   $entry.status='assertions-passed'
  }catch{$entry.status='failed';$entry.error=$_.Exception.Message}
  finally{$entry.checks=@($script:Checks.ToArray());$script:Cases.Add([pscustomobject]$entry);Save-CaseProgress}
 }
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


function Reset-Menu([int]$Revision=0){
 Command 'mounted' $false|Out-Null
 Command 'revision' $Revision|Out-Null
 Command 'disabled' $false|Out-Null
 Command 'scene' 'dropdown-menu'|Out-Null
 Command 'mounted' $true|Out-Null
 Status-Contains ("revision=$Revision mounted=true")
}
function Menu-Requests([bool]$Open){
 return @(Read-Events|Where-Object {$_.bootId -eq $script:Boot.bootId -and $_.event -eq 'layer-open-change' -and $_.source -eq 'dropdown-menu' -and $_.open -eq $Open}).Count
}
function Menu-State([bool]$Open,[string]$Stage){
 Named (Capture $Stage) ('Menu open='+$Open.ToString().ToLowerInvariant())|Out-Null
}
function Menu-Shape([int]$Revision,[string]$Stage,[bool]$Enabled=$true){
 $nodes=Snapshot $Stage
 $tree=Capture $Stage
 $peer=Named @($tree|Where-Object {$_.type -eq 'ControlType.Button'}) ("Actions $Revision")
 Assert (Finite $peer) 'Menu trigger has finite visible bounds' $peer
 Assert ($peer.patterns -contains 'InvokePatternIdentifiers.Pattern') 'Menu trigger exposes Invoke' $peer.patterns
 Assert ($peer.enabled -eq $Enabled) 'Menu trigger has expected enabled state' $peer.enabled
 $drawing=Native-Id $nodes 'core20-dropdown-menu'
 $anchor=Native-Id $nodes 'core20-dropdown-menu-native-menu'
 foreach($frame in @($drawing.box,$anchor.box)){
  Assert ((Near ($peer.x/$script:Scale) $frame.x) -and (Near ($peer.y/$script:Scale) $frame.y) -and (Near $peer.width $frame.width) -and (Near $peer.height $frame.height)) 'Menu native anchor and trigger drawing agree' @{peer=$peer;frame=$frame}
 }
 return $peer
}
function Menu-Open([int]$Revision,$Trigger,[string]$Stage){
 $tree=Capture $Stage
 $menu=Named @($tree|Where-Object {$_.type -eq 'ControlType.Menu'}) ("Action menu $Revision")
 Assert (Finite $menu) 'Menu surface exposes its requested name and finite bounds' $menu
 Assert ($menu.width -ge $Trigger.width-2) 'Menu respects the trigger minimum width' @{menu=$menu.width;trigger=$Trigger.width}
 $bottom=$Trigger.y+$Trigger.height*$script:Scale
 Assert ($menu.y -ge $bottom-2*$script:Scale -and $menu.y-$bottom -le 20*$script:Scale) 'Bottom menu is anchored below its trigger' @{menu=$menu;trigger=$Trigger}
 Assert ($menu.x -le $Trigger.x+$Trigger.width*$script:Scale -and $menu.x+$menu.width*$script:Scale -ge $Trigger.x) 'Menu and trigger overlap along the alignment axis' @{menu=$menu;trigger=$Trigger}
 $items=@($tree|Where-Object {$_.type -eq 'ControlType.MenuItem'})
 Assert ($items.Count -eq 3) 'Menu exposes exactly three genuine MenuItem peers' $items.Count
 foreach($name in @("First action $Revision",'Unavailable action',"Third action $Revision")){
  $item=Named $items $name
  Assert (Finite $item) "Menu item $name has finite visible bounds" $item
  Assert ($item.patterns -contains 'InvokePatternIdentifiers.Pattern') "Menu item $name exposes Invoke" $item.patterns
 }
 $first=Named $items ("First action $Revision");$disabled=Named $items 'Unavailable action';$third=Named $items ("Third action $Revision")
 Assert (-not $disabled.enabled -and -not $disabled.focusable) 'Disabled menu item rejects focus' $disabled
 Assert ($first.y+$first.height*$script:Scale -le $disabled.y+2*$script:Scale -and $disabled.y+$disabled.height*$script:Scale -le $third.y+2*$script:Scale) 'Menu rows are ordered without overlap' $items
 $nodes=Snapshot ($Stage+'-content')
 foreach($id in @('core20-menu-first','core20-menu-disabled','core20-menu-third')){
  $content=Native-Id $nodes $id
  Assert ($content.box.width -gt 0 -and $content.box.height -gt 0) "Shared row $id has nonempty bounds" $content.box
 }
 return ,$items
}
function Check-MenuActions {
 $script:Checks.Clear()
 $entry=[ordered]@{case='public-dropdown-menu-actions';status='running';checks=$null;error=$null}
 try{
  Reset-Menu
  $trigger=Menu-Shape 0 'menu-initial'
  Focus-Action 'Before menu' 'ControlType.Button';Key 9
  Wait-For {Focused 'Actions 0'} 'Tab did not focus menu trigger'
  Key 9;Wait-For {Focused 'After menu'} 'Tab did not leave menu trigger after one stop'
  Key 9 $true;Wait-For {Focused 'Actions 0'} 'Shift+Tab did not return to menu trigger'
  Assert $true 'Closed menu contributes one forward/backward Tab stop'
  $opened=Menu-Requests $true;Key 13
  $items=Menu-Open 0 $trigger 'menu-keyboard-open'
  Assert ((Menu-Requests $true) -eq $opened+1) 'Keyboard opening reports one request'
  Menu-State $true 'menu-open-model'
  Wait-For {Focused 'First action 0'} 'Keyboard opening did not focus the first menu item'
  $disabled=Uia-Action 'invoke' 'Unavailable action' 'ControlType.MenuItem'
  Assert ($disabled.status -eq 'rejected') 'Disabled menu item rejects Invoke' $disabled
  $before=Activations 'menu-disabled';Click-Control (Named $items 'Unavailable action')
  Assert ((Activations 'menu-disabled') -eq $before) 'Disabled menu item rejects pointer activation'
  Menu-State $true 'menu-disabled-stays-open'
  Key 40;Wait-For {Focused 'Third action 0'} 'Down did not skip the disabled menu item'
  Exactly-Once 'menu-third' 'menu Down then Enter' {Key 13}
  Menu-State $false 'menu-enter-commit'
  Wait-For {Focused 'Actions 0'} 'Menu action did not return trigger focus'
  Click-Control $trigger;Menu-Open 0 $trigger 'menu-pointer-open'|Out-Null
  Exactly-Once 'menu-first' 'menu UIA Invoke' {$result=Uia-Action 'invoke' 'First action 0' 'ControlType.MenuItem';Assert ($result.status -eq 'completed') 'Native menu Invoke completed' $result}
  Menu-State $false 'menu-invoke-commit'
  Click-Control $trigger;$items=Menu-Open 0 $trigger 'menu-before-mouse-action'
  $pointerTarget=Named $items 'Third action 0'
  $menuSurface=Named @((Capture 'menu-probe-surface')|Where-Object {$_.type -eq 'ControlType.Menu'}) ('Action menu 0')
  $sweep=@()
  for($py=$menuSurface.y+8;$py -lt $menuSurface.y+$menuSurface.height*$script:Scale;$py+=16){
   $probe=Uia-Action 'point' '' '' ([ordered]@{x=($menuSurface.x+$menuSurface.width*$script:Scale/2);y=$py;probe=('sweep-'+[int]$py)})
   Assert ($probe.status -eq 'completed') ('Point probe y='+$py) $probe.chain[0]
   $sweep+=@{y=[int]$py;hit=$probe.chain[0].className;hitName=$probe.chain[0].name;hitType=$probe.chain[0].type}
  }
  [IO.File]::WriteAllText((Join-Path $OutputDirectory 'menu-point-sweep.json'),($sweep|ConvertTo-Json -Depth 4),[Text.UTF8Encoding]::new($false))
  Exactly-Once 'menu-third' 'menu pointer item' {[Core20ActionInput]::Click([int]($pointerTarget.x+$pointerTarget.width*$script:Scale/2),[int]($pointerTarget.y+8))}
  Menu-State $false 'menu-pointer-commit'
  Focus-Action 'Actions 0' 'ControlType.Button';Key 32
  Menu-Open 0 $trigger 'menu-space-open'|Out-Null
  $closed=Menu-Requests $false;$before=Activations 'menu-third';Key 27
  Menu-State $false 'menu-escape'
  Assert ((Menu-Requests $false) -eq $closed+1) 'Escape reports one menu close request'
  Assert ((Activations 'menu-third') -eq $before) 'Escape closes without another action'
  Wait-For {Focused 'Actions 0'} 'Escape did not restore menu trigger focus'
  Click-Control $trigger;Menu-Open 0 $trigger 'menu-before-outside'|Out-Null
  $outside=Named @((Capture 'menu-outside-target')|Where-Object {$_.type -eq 'ControlType.Button'}) 'Before menu'
  $closed=Menu-Requests $false;Click-Control $outside;Menu-State $false 'menu-outside-dismiss'
  Assert ((Menu-Requests $false) -eq $closed+1) 'Outside pointer reports one close request'
  Click-Control $trigger;Menu-Open 0 $trigger 'menu-before-update'|Out-Null
  Command 'revision' 1|Out-Null
  $updated=Menu-Shape 1 'menu-updated-trigger'
  Menu-Open 1 $updated 'menu-updated-items'|Out-Null
  Exactly-Once 'menu-first' 'updated menu Invoke' {$result=Uia-Action 'invoke' 'First action 1' 'ControlType.MenuItem';Assert ($result.status -eq 'completed') 'Updated menu Invoke completed' $result}
  Menu-State $false 'menu-updated-commit'
  $events=@(Read-Events|Where-Object {$_.bootId -eq $script:Boot.bootId -and $_.event -eq 'activation' -and $_.source -eq 'menu-first'})
  Assert ($events[-1].fixtureRevision -eq 1) 'Menu action reads the current callback revision' $events[-1]
  Reset-Menu 2;$reject=Menu-Shape 2 'menu-rejected-trigger'
  Focus-Action 'Actions 2' 'ControlType.Button';$opened=Menu-Requests $true;Key 13
  Menu-State $false 'menu-controlled-rejection'
  Assert ((Menu-Requests $true) -eq $opened+1) 'Controlled rejection preserves exactly one open request'
  Assert (@((Capture 'menu-rejected-items')|Where-Object {$_.type -eq 'ControlType.MenuItem'}).Count -eq 0) 'Rejected controlled opening leaves no native menu items'
  Reset-Menu;Command 'disabled' $true|Out-Null
  $disabled=Menu-Shape 0 'menu-disabled-trigger' $false
  $result=Uia-Action 'focus' 'Actions 0' 'ControlType.Button';Assert ($result.status -eq 'rejected') 'Disabled menu trigger rejects focus' $result
  $result=Uia-Action 'invoke' 'Actions 0' 'ControlType.Button';Assert ($result.status -eq 'rejected') 'Disabled menu trigger rejects Invoke' $result
  Click-Control $disabled;Menu-State $false 'menu-disabled-pointer'
  Focus-Action 'Before menu' 'ControlType.Button';Key 9
  Wait-For {Focused 'After menu'} 'Tab did not skip disabled menu trigger'
  Key 13;Key 32;Menu-State $false 'menu-disabled-keys'
  Command 'mounted' $false|Out-Null
  Assert (@((Capture 'menu-unmounted')|Where-Object {$_.type -eq 'ControlType.Menu' -or $_.type -eq 'ControlType.MenuItem' -or $_.name -eq 'Actions 0'}).Count -eq 0) 'Unmount removes menu trigger and item peers'
  Reset-Menu;$trigger=Menu-Shape 0 'menu-remounted';Menu-State $false 'menu-remounted-default'
  Focus-Action 'Actions 0' 'ControlType.Button';Key 13
  Menu-Open 0 $trigger 'menu-remounted-open'|Out-Null
  Exactly-Once 'menu-first' 'remounted menu action' {Key 13}
  Menu-State $false 'menu-remounted-commit'
  if(-not [Core20Desktop]::MoveWindow($script:WindowHandle,$left,$top,$narrowWidth,$height,$true)){throw 'Cannot narrow the owned menu window'}
  $narrow=Menu-Shape 0 'menu-narrow'
  Assert ($narrow.width -lt $trigger.width) 'Menu trigger and native anchor shrink together' @{wide=$trigger.width;narrow=$narrow.width}
  Click-Control $narrow;Menu-Open 0 $narrow 'menu-narrow-open'|Out-Null;Key 27
  if(-not [Core20Desktop]::MoveWindow($script:WindowHandle,$left,$top,$wideWidth,$height,$true)){throw 'Cannot restore the owned menu window'}
  $wide=Menu-Shape 0 'menu-wide-restored'
  Assert (Near $wide.width $trigger.width) 'Menu trigger and anchor restore after widening' @{before=$trigger.width;after=$wide.width}
  $entry.status='assertions-passed'
 }catch{$entry.status='failed';$entry.error=$_.Exception.Message}
 finally{$entry.checks=@($script:Checks.ToArray());$script:Cases.Add([pscustomobject]$entry)}
}

function Service-Result([string]$Spec,[int]$Seconds=20){
 Wait-For { @(Read-Events|Where-Object {$_.bootId -eq $script:Boot.bootId -and $_.event -eq 'service-result' -and $_.spec -ceq $Spec}).Count -ge 1 } "No service-result for $Spec" $Seconds
 $result=@(Read-Events|Where-Object {$_.bootId -eq $script:Boot.bootId -and $_.event -eq 'service-result' -and $_.spec -ceq $Spec})[-1]
 $result|ConvertTo-Json -Depth 6|Set-Content (Join-Path $OutputDirectory ("service-"+$Spec+".json")) -Encoding UTF8
 return $result
}
function Try-Field([string]$Name,[string]$Type='ControlType.Edit'){
 try{$r=Uia-Action 'field' $Name $Type; if($r.status -eq 'completed' -and $r.target){return $r}}catch{}
 return $null
}
function Field-State([string]$Name,[string]$Type='ControlType.Edit'){
 $r=Uia-Action 'field' $Name $Type
 Assert ($r.status -eq 'completed') "UIA field read accepted for $Name" $r
 return $r
}
function Focus-Field([string]$Name){Focus-Action $Name 'ControlType.Edit'}
function Input-Events([string]$Source,[string]$Kind){
 return @(Read-Events|Where-Object {$_.bootId -eq $script:Boot.bootId -and $_.event -ceq 'input-event' -and $_.source -ceq $Source -and $_.kind -ceq $Kind})
}
function Key-Events([string]$Source,[string]$Kind){
 return @(Read-Events|Where-Object {$_.bootId -eq $script:Boot.bootId -and $_.event -ceq 'key-event' -and $_.source -ceq $Source -and $_.kind -ceq $Kind})
}
function Scroll-States([string]$Axis='block'){
 return @(Read-Events|Where-Object {$_.bootId -eq $script:Boot.bootId -and $_.event -ceq 'scroll-state' -and $_.axis -ceq $Axis})
}
function Check-TextInputActions{
 $script:Checks.Clear()
 $entry=[ordered]@{case='windows-controlled-text-write';status='running';checks=$null;error=$null}
 try{
 Command 'scene' 'input'|Out-Null
 Status-Contains 'Core20 input mounted=true'
 Wait-For {$null -ne (Try-Field 'Controlled field')} 'Controlled field never appeared'

 $field=Field-State 'Controlled field'
 Assert ($field.target.enabled -eq $true -and $field.target.focusable -eq $true) 'Controlled field is enabled and focusable' $field
 Assert ($field.value -eq 'typed!') 'Controlled field opens with its controlled value' $field.value

 Focus-Field 'Controlled field'
 Wait-For {@(Input-Events 'controlled' 'focus').Count -ge 1} 'Controlled focus did not emit an input-event'
 Assert ($true) 'Focusing the controlled field emits its focus event'

 Key 35|Out-Null
 Key 88|Out-Null
 Start-Sleep -Milliseconds 350
 Key 89|Out-Null
 Start-Sleep -Milliseconds 350
 Wait-For {(Field-State 'Controlled field').value -eq 'typed!xy'} 'Typed characters did not reach the controlled field'
 Assert ($true) 'Physical typing reaches the controlled field value'
 $changes=Input-Events 'controlled' 'change'
 Assert ($changes[-1].value -eq 'typed!xy' -and $changes.Count -ge 2) 'onChange reports each typed edit' @($changes|Select-Object -Last 2).value
 $downs=@(Key-Events 'controlled' 'down'|Where-Object {$_.key -eq 88 -or $_.key -eq 89})
 $ups=@(Key-Events 'controlled' 'up'|Where-Object {$_.key -eq 88 -or $_.key -eq 89})
 Assert ($downs.Count -ge 2 -and $ups.Count -ge 2) 'Raw keyDown/keyUp payloads project for typed keys' @{downs=$downs.Count;ups=$ups.Count}

 Command 'input-write' 'typed!xy'|Out-Null
 Wait-For {(Field-State 'Controlled field').value -eq 'typed!xy'} 'Controlled write did not apply'
 Key 35|Out-Null
 Key 37 $true|Out-Null
 Key 37 $true|Out-Null
 Command 'input-write' 'typed!xyW'|Out-Null
 Wait-For {(Field-State 'Controlled field').value -eq 'typed!xyW'} 'Same-length controlled write did not apply'
 $sel=Field-State 'Controlled field'
 Assert (@($sel.selection).Count -ge 1 -and $sel.selection[0].start -eq 6 -and $sel.selection[0].length -eq 2) 'Controlled write preserves the OS-selected range' $sel.selection
 Command 'input-write' 'x'|Out-Null
 Wait-For {(Field-State 'Controlled field').value -eq 'x'} 'Shrinking write did not apply'
 $sel=Field-State 'Controlled field'
 Assert (@($sel.selection).Count -ge 1 -and $sel.selection[0].start -eq 1 -and $sel.selection[0].length -eq 0) 'Shrinking write clamps the selection to the new length' $sel.selection
 $changesBefore=@(Input-Events 'controlled' 'change').Count
 Command 'input-write' 'x'|Out-Null
 Start-Sleep -Milliseconds 400
 Assert (@(Input-Events 'controlled' 'change').Count -eq $changesBefore) 'Unchanged controlled writes emit no synthetic change event'

 $beforeHold=@(Key-Events 'controlled' 'down').Count
 Key-Down 65
 Start-Sleep -Milliseconds 900
 Key-Up 65
 $held=@(Key-Events 'controlled' 'down').Count-$beforeHold
 Assert ($held -ge 1) 'A held key emits its raw keyDown' $held
 Assert ((Field-State 'Controlled field').value -like 'xa*') 'A held key enters its character'

 Focus-Field 'Second field'
 Key 67|Out-Null
 Wait-For {@(Input-Events 'second' 'change').Count -ge 1} 'Second field did not emit a change'
 Assert (@(Key-Events 'second' 'down'|Where-Object {$_.key -eq 67}).Count -ge 1 -and @(Key-Events 'controlled' 'down'|Where-Object {$_.key -eq 67}).Count -eq 0) 'Key owners stay independent across fields'

 Focus-Field 'Consumed field'
 Key 13|Out-Null
 Start-Sleep -Milliseconds 300
 Assert (@(Key-Events 'consumed' 'down'|Where-Object {$_.key -eq 13}).Count -ge 1) 'Consumed field still sees the raw Return payload'
 Assert (@(Input-Events 'consumed' 'submit').Count -eq 0) 'Consumed Return suppresses the submit event'

 Focus-Field 'Controlled field'
 Key 13|Out-Null
 Wait-For {@(Input-Events 'controlled' 'submit').Count -ge 1} 'Return did not submit the controlled field'
 Assert ($true) 'Unconsumed Return submits through returnPress'

 $secure=Field-State 'Secure field'
 Assert ($secure.target.isPassword -eq $true) 'Secure field masks through a real PasswordBox peer' $secure.target
 Focus-Field 'Secure field'
 Key 68|Out-Null
 Wait-For {@(Input-Events 'secure' 'change').Count -ge 1} 'Secure field did not emit a change'
 Assert (@(Key-Events 'secure' 'down'|Where-Object {$_.key -eq 68}).Count -ge 1) 'Secure edits emit raw key payloads without plaintext'

 $readonly=Field-State 'Readonly field'
 Assert ($readonly.isReadOnly -eq $true -or $readonly.target.focusable -eq $true) 'Readonly field exposes its non-editable state' $readonly
 $roBefore=@(Input-Events 'readonly' 'change').Count
 try{Uia-Action 'focus' 'Readonly field' 'ControlType.Edit'|Out-Null}catch{}
 Key 82|Out-Null
 Start-Sleep -Milliseconds 300
 Assert (@(Input-Events 'readonly' 'change').Count -eq $roBefore -and (Field-State 'Readonly field').value -eq 'frozen') 'Physical edits cannot change a readonly field'

 $disabled=Field-State 'Disabled field'
 Assert ($disabled.target.enabled -eq $false) 'Disabled field reports disabled through UIA' $disabled.target
 $disFocus=$null
 try{$disFocus=Uia-Action 'focus' 'Disabled field' 'ControlType.Edit'}catch{}
 Assert ($null -eq $disFocus -or $disFocus.status -eq 'rejected' -or $disFocus.targetFocused -eq $false) 'Disabled field rejects focus'
 Assert (@(Input-Events 'disabled' 'change').Count -eq 0) 'Disabled field emits no edits'

 Focus-Field 'Form user'
 Key 9|Out-Null
 Wait-For {Focused 'Form pass'} 'Tab did not move focus to the next form field'
 Assert (@(Input-Events 'form-user' 'blur').Count -ge 1 -and @(Input-Events 'form-pass' 'focus').Count -ge 1) 'Focus transitions emit blur and focus events'
 Key 70|Out-Null
 Wait-For {@(Input-Events 'form-pass' 'change').Count -ge 1} 'Form pass edit did not emit a change'
 Assert ($true) 'Sequential form fields accept edits in focus order'

 Command 'mounted' $false|Out-Null
 Wait-For {$null -eq (Try-Field 'Controlled field')} 'Controlled field still exists after unmount'
 Assert ($true) 'Unmount disposes the native input views'
 Command 'mounted' $true|Out-Null
 Wait-For {$null -ne (Try-Field 'Controlled field')} 'Controlled field did not remount'
 Assert ((Field-State 'Controlled field').value -like 'x*') 'Remounted field restores the controlled value' (Field-State 'Controlled field').value
 $keysBefore=@(Key-Events 'controlled' 'down').Count
 Focus-Field 'Controlled field'
 Key 66|Out-Null
 Wait-For {@(Key-Events 'controlled' 'down').Count -gt $keysBefore} 'Key listeners did not reattach after remount'
 Assert ($true) 'Remounted fields reattach raw key listeners'

  $entry.status=if(@($script:Checks|Where-Object {-not $_.passed}).Count){'failed'}else{'assertions-passed'}
 }catch{$entry.status='failed';$entry.error=$_.Exception.Message}
 finally{$entry.checks=@($script:Checks.ToArray());$script:Cases.Add([pscustomobject]$entry)}
}
function Check-ScrollActions{
 $script:Checks.Clear()
 $entry=[ordered]@{case='windows-scroll-observation';status='running';checks=$null;error=$null}
 try{
 Command 'scene' 'scroll'|Out-Null
 Wait-For {@(Scroll-States 'block').Count -ge 1} 'Scroll fixture never reported its initial state'
 $initial=@(Scroll-States 'block')[-1]
 Assert ($initial.isScrollable -eq $true -and $initial.atStart -eq $true -and $initial.atEnd -eq $false) 'Overflowing content reports scrollable at the start edge' $initial

 $nodes=Snapshot 'scroll-initial'
 $vp=Native-Id $nodes 'scroll-viewport'
 Assert ($null -ne $vp.box -and $vp.box.width -gt 0 -and $vp.box.height -gt 0) 'Scroll viewport has finite readout bounds' $vp
 Mouse-Move ([int](($vp.box.x+$vp.box.width/2)*$script:Scale)) ([int](($vp.box.y+$vp.box.height/2)*$script:Scale))
 Mouse-Wheel -120
 Wait-For {@(Scroll-States 'block'|Where-Object {$_.atStart -eq $false}).Count -ge 1} 'Wheel scroll did not move the viewport'
 Assert ($true) 'Physical wheel input scrolls the viewport off the start edge'
 for($i=0;$i -lt 8;$i++){Mouse-Wheel -120;Start-Sleep -Milliseconds 120}
 Wait-For {@(Scroll-States 'block'|Where-Object {$_.atEnd -eq $true}).Count -ge 1} 'Viewport never reached the end edge'
 Assert ($true) 'Wheel input reaches the end edge'
 for($i=0;$i -lt 8;$i++){Mouse-Wheel 120;Start-Sleep -Milliseconds 120}
 Wait-For {@(Scroll-States 'block'|Where-Object {$_.atStart -eq $true}).Count -ge 1} 'Viewport never returned to the start edge'
 Assert ($true) 'Wheel input returns to the start edge'

 $statesBefore=@(Scroll-States 'block').Count
 Command 'scroll-rows' 3|Out-Null
 Wait-For {@(Scroll-States 'block').Count -gt $statesBefore} 'Content shrink did not publish new scroll state'
 Assert (@(Scroll-States 'block')[-1].isScrollable -eq $false) 'Shrinking content below the viewport clears overflow' @(Scroll-States 'block')[-1]
 $statesBefore=@(Scroll-States 'block').Count
 Command 'scroll-rows' 48|Out-Null
 Wait-For {@(Scroll-States 'block').Count -gt $statesBefore} 'Content growth did not publish new scroll state'
 Assert (@(Scroll-States 'block')[-1].isScrollable -eq $true -and @(Scroll-States 'block')[-1].atStart -eq $true) 'Growing content restores overflow at the start edge' @(Scroll-States 'block')[-1]

 try{
  if(-not [Core20Desktop]::MoveWindow($script:WindowHandle,$left,$top,$narrowWidth,$height,$true)){throw 'Cannot narrow the owned window'}
  $resized=Snapshot 'scroll-narrowed'
  $vpNarrow=Native-Id $resized 'scroll-viewport'
  Assert ($vpNarrow -and $vpNarrow.box.width -gt 0 -and $vpNarrow.box.x -ge 0) 'Viewport retains finite bounds after a window resize' $vpNarrow
 }finally{
  [Core20Desktop]::MoveWindow($script:WindowHandle,$left,$top,$wideWidth,$height,$true)|Out-Null
 }

 Command 'mounted' $false|Out-Null
 $gone=Snapshot 'scroll-unmounted'
 Assert ($null -eq (Native-Find $gone 'scroll-viewport')) 'Unmount disposes the scroll viewport'
 Command 'mounted' $true|Out-Null
 Wait-For {$null -ne (Native-Find (Snapshot 'scroll-remounted') 'scroll-viewport')} 'Scroll viewport did not remount'
 Assert ($true) 'Remount restores the scroll viewport and its observer'

  $entry.status=if(@($script:Checks|Where-Object {-not $_.passed}).Count){'failed'}else{'assertions-passed'}
 }catch{$entry.status='failed';$entry.error=$_.Exception.Message}
 finally{$entry.checks=@($script:Checks.ToArray());$script:Cases.Add([pscustomobject]$entry)}
}
function Check-ServiceActions{
 $script:Checks.Clear()
 $entry=[ordered]@{case='windows-service-adapters';status='running';checks=$null;error=$null}
 try{
 Command 'scene' 'service'|Out-Null
 Status-Contains 'Core20 service '
 $specs=@('clipboard','random','storage','keepawake','connectivity','device','appinfo','files','files-chunk','files-stream','auth','window-metrics','clipboard-nontext','secure-storage','secure-persist','secure-depth','files-pickers','files-identity','media-depth','keepawake-depth','corefs','storage-persist')
 $serviceFilter=@($ServiceSpecs|Where-Object {$_})
 if($serviceFilter.Count){$specs=@($specs+'storage-verify','secure-verify'|Where-Object {$_ -cin $serviceFilter})}
 foreach($spec in $specs){
  try{
  if($spec -eq 'clipboard-nontext'){Set-Clipboard -LiteralPath $PSCommandPath}
  Command 'service-run' $spec|Out-Null
  $result=Service-Result $spec
  switch($spec){
   'clipboard' {
    Assert ($result.canCopy -eq $true) 'Clipboard service is available on the packaged host' $result
    Assert ($result.wrote -eq $true) 'Clipboard writeText accepts Unicode content' $result
    Assert ($result.matched -eq $true) 'Clipboard readText round-trips Unicode content' $result
    Assert ($result.wroteEmpty -eq $true -and $null -eq $result.readEmpty) 'Clipboard empty writes read back as null per the shared contract' $result
   }
   'random' {
    Assert ($result.supported -eq $true) 'OS CSPRNG is bound on the packaged host' $result
    Assert ($result.smallLength -eq 32 -and $result.zeroLength -eq 0) 'CSPRNG honours requested byte lengths' $result
    Assert ($result.smallDistinct -eq $true -and $result.consecutiveDistinct -eq $true) 'CSPRNG produces distinct byte sequences' $result
    Assert ($result.filledDistinct -gt 50) 'CSPRNG fills large buffers with varied bytes' $result
    Assert ($result.nonViewError -eq 'TypeError' -and $result.negativeError -eq 'RangeError') 'CSPRNG rejects invalid inputs' $result
   }
   'storage' {
    Assert ($result.read -eq 'roundtrip') 'Storage setString/getString round-trips' $result
    Assert ($result.emptyRead -eq '') 'Storage keeps empty-string values' $result
    Assert ($result.ctrlRead -like 'ctrl*') 'Storage keeps control characters' $result
    Assert ($null -eq $result.removedRead -or $result.removedRead -eq '') 'Storage remove clears the key' $result
   }
   'keepawake' {
    Assert ($result.activated -eq $true) 'Keep-awake grants an OS display request' $result
    Assert ($result.deactivated -eq $true) 'Keep-awake releases the grant cleanly' $result
    Assert (@($result.activatedTwo) -notcontains $false -and $result.releaseA -eq $true -and $result.releaseB -eq $true) 'Independent keep-awake tags clean up independently' $result
   }
   'connectivity' {
    Assert ($null -ne $result.current) 'Connectivity reports a real current state' $result
    Assert ($null -ne $result.resample) 'Connectivity resamples on demand' $result
   }
   'device' {
    Assert ($result.os -eq 'windows') 'Device reports the windows platform' $result
   }
   'appinfo' {
    Assert ($null -ne $result.id -or $null -ne $result.name -or $null -ne $result.version) 'Packaged app-info exposes identity fields' $result
   }
   'files' {
    Assert ($result.matchedText -eq $true) 'File service writeText/readText round-trips text' $result
    Assert ($result.matchedBytes -eq $true) 'File service writeBytes/readBytes round-trips binary' $result
    Assert ($result.differentUris -eq $true) 'Owned file copies get unique URIs' $result
    Assert ($result.pickError -ne '' -and $result.pickError -ne $null) 'File pickers report unavailability explicitly' $result
    Assert ($result.exported -eq 'unavailable') 'File export reports unavailable on the current surface' $result
    Assert ($result.released -eq $true) 'Owned file release schedules cleanup' $result
   }
   'corefs' {
    Assert ($result.documentsPresent -eq $true) 'Documents folder resolves on the packaged host' $result
    Assert ($result.existsAfter -eq $true) 'File.exists detects the created file' $result
    Assert ($result.matchedText -eq $true) 'File readText round-trips text' $result
    Assert ($result.nestedExists -eq $true) 'Folder.fromPath creates nested folders' $result
    Assert ($result.tempExists -eq $true) 'Temporary folder accepts new files' $result
   }
   'storage-persist' {
    Assert ($result.persistWrote -eq 'persisted-across-launches') 'Storage persist spec wrote the cross-launch value' $result
   }
   'secure-storage' {
    Assert ($result.supported -eq $true -and $result.available -eq $true) 'Credential Locker resolves on the packaged host' $result
    Assert ($null -eq $result.missing) 'Secure storage reads missing keys as null' $result
    Assert ($result.read -eq 'vault-roundtrip') 'Secure storage round-trips values' $result
    Assert ($result.wroteEmpty -eq $true -and $result.readEmpty -eq '') 'Secure storage keeps empty values' $result
    Assert ($result.readCtrl -like 'ctrl*') 'Secure storage keeps control characters' $result
    Assert ($result.otherRead -eq 'other-value') 'Distinct secure keys stay separate in the shared namespace' $result
    Assert ($result.removed -eq $true -and $null -eq $result.removedRead) 'Secure storage remove clears the key' $result
    Assert ($result.removedOther -eq $true -and $result.removedMissing -eq $true) 'Secure storage remove is idempotent' $result
   }
   'secure-persist' {
    Assert ($result.persistWrote -eq 'persisted-secure-across-launches') 'Secure persist spec wrote the cross-launch value' $result
   }
   'files-chunk' {
    Assert ($result.maxError -like '*byte limit*') 'readBytes enforces its maxBytes bound' $result
    Assert ($result.abortError -eq 'AbortError') 'readBytes honours aborted signals' $result
    Assert ($result.fullLength -eq 6) 'readBytes returns full content inside bounds' $result
   }
   'clipboard-nontext' {
    Assert ($null -eq $result.read) 'Clipboard reads null for a non-text OS payload' $result
   }
   'auth' {
    Assert ($result.sessionSupported -eq $false -and $result.sessionAvailable -eq $false) 'Auth session reports bounded unavailability' $result
    Assert ($result.sessionError -ne '' -and $null -ne $result.sessionError) 'Auth session open reports explicit unavailability' $result
    Assert ($result.passkeySupported -eq $false -and $result.passkeyAvailable -eq $false) 'WebAuthn reports bounded unavailability' $result
   }
   'window-metrics' {
    Assert ($result.widthDIPs -gt 0 -and $result.heightDIPs -gt 0) 'Primary window reports real DIP geometry' $result
    Assert ($result.orientation -eq 'landscape' -or $result.orientation -eq 'portrait') 'Orientation derives from DIP geometry' $result
   }
   'secure-depth' {
    Assert ($result.supported -eq $true -and $result.available -eq $true) 'Credential Locker resolves on the packaged host' $result
    Assert ($result.wroteEmpty -eq $true -and $result.readEmpty -eq '') 'Secure depth keeps empty values' $result
    Assert ($result.wroteCtrl -eq $true -and $result.readCtrl -ceq ('ctrl-' + [char]1)) 'Secure depth round-trips the exact control-character value' $result
    Assert ($result.readOver -ceq 'second') 'Secure depth overwrites an existing key' $result
    Assert ($result.removed -eq $true -and $null -eq $result.readAfterRemove) 'Secure depth remove clears the key' $result
   }
   'files-pickers' {
    Assert ($result.pickError -ceq 'UnavailabilityError') 'files.pick reports explicit unavailability' $result
    Assert ($result.pickMultiError -ceq 'UnavailabilityError') 'files.pickMultiple reports explicit unavailability' $result
    Assert ($result.exportResult -ceq 'unavailable' -and $result.exportError -ceq '') 'files.export reports bounded unavailability' $result
   }
   'files-identity' {
    Assert ($result.sameNameDistinct -eq $true) 'Repeated sandbox writes keep distinct URIs' $result
    Assert ($result.exactBytes -eq $true) 'Sandbox writes preserve each distinct byte payload' $result
    Assert ($result.existedBeforeRelease -eq $true -and $result.removedA -eq $true -and $result.removedB -eq $true) 'Release deletes both previously existing owned files' $result
    Assert ($result.foreignSurvived -eq $true) 'Release preserves the unowned file and its contents' $result
   }
   'files-stream' {
    Assert ($result.fullMatch -eq $true) 'A 512 KiB write reads back byte-exact across chunk boundaries' $result
    Assert ($result.exactLength -eq 524288) 'maxBytes equal to size passes' $result
    Assert ($result.underError -match 'file exceeds the 524287-byte limit') 'maxBytes one under rejects with the byte-limit error' $result
    Assert ($result.midAbort -eq 'AbortError' -and $result.calls -ge 7) 'Aborting mid-read rejects with AbortError after streamed chunks' $result
   }
   'keepawake-depth' {
    Assert ($result.first -eq $true -and $result.again -eq $true) 'Duplicate tag activation stays true' $result
    Assert ($result.releaseDup -eq $true -and $result.releaseDupAgain -eq $true) 'Releasing an already-released tag is a benign no-op' $result
    Assert ($result.missing -eq $true) 'Releasing a never-activated tag reports availability' $result
    Assert ($result.pairA -eq $true -and $result.pairB -eq $true -and $result.releaseBogus -eq $true) 'Bogus tag release leaves the shared request owned' $result
    Assert ($result.releasePairA -eq $true -and $result.releasePairB -eq $true) 'Both pair tags release cleanly' $result
    Assert ($result.reacquire -eq $true -and $result.releaseRe -eq $true) 'A fresh request re-acquires after full release' $result
   }
   'media-depth' {
    Assert ($result.screen -eq $true) 'Screen.mainScreen projects on the packaged host' $result
   }
  }
  }catch{
   $script:Checks.Add([pscustomobject]@{name="Service spec '$spec' completed";passed=$false;actual=$_.Exception.Message})
  }
 }
 # storage-verify is for a SECOND launch: assert the value persisted across relaunch
 $verify=@(Read-Events|Where-Object {$_.bootId -eq $script:Boot.bootId -and $_.event -eq 'service-result' -and $_.spec -ceq 'storage-verify'})
 if($verify.Count){
  Assert ($verify[-1].persistRead -eq 'persisted-across-launches') 'Storage value persists across app relaunch' $verify[-1]
 }
 $secureVerify=@(Read-Events|Where-Object {$_.bootId -eq $script:Boot.bootId -and $_.event -eq 'service-result' -and $_.spec -ceq 'secure-verify'})
 if($secureVerify.Count){
  Assert ($secureVerify[-1].persistRead -eq 'persisted-secure-across-launches') 'Secure value persists across app relaunch' $secureVerify[-1]
 }
  $entry.status=if(@($script:Checks|Where-Object {-not $_.passed}).Count){'failed'}else{'assertions-passed'}
 }catch{$entry.status='failed';$entry.error=$_.Exception.Message}
 finally{$entry.checks=@($script:Checks.ToArray());$script:Cases.Add([pscustomobject]$entry)}
}

$report=[ordered]@{
 schemaVersion=1;packageVersion=$pkg.Version.ToString();packageFamilyName=$pkg.PackageFamilyName
 driverSha256=(Get-FileHash -LiteralPath $PSCommandPath -Algorithm SHA256).Hash
 actionHelperSha256=(Get-FileHash -LiteralPath (Join-Path $PSScriptRoot 'action-uia.ps1') -Algorithm SHA256).Hash
 readerSha256=(Get-FileHash -LiteralPath (Join-Path $PSScriptRoot 'capture-uia.ps1') -Algorithm SHA256).Hash
 expectedCommit=$ExpectedCommit;allowDirtyProbe=[bool]$AllowDirtyProbe;displayActionCase=$DisplayActionCase
 scope=$(if($MenuActions){'Public finite action DropdownMenu: shared Button and row drawing, genuine Menu/MenuItem/Invoke, names and anchored bounds, OS input, controlled rejection, disabled, updates, remount and resize. Complex/sheet/custom-styled menus and final fresh-install20 remain separate.'}elseif($SelectorActions){'Public single Selector: ComboBox/SelectionItem peers, shared drawing bounds, keyboard/mouse commit, Escape/focus, outside dismissal, updates, controlled rejection, disabled, remount and trigger resize. Search/multiple/clear and full props, long lists and final fresh-main core20 qualification remain separate.'}elseif($TabActions){'Public panel TabList/Tab: genuine TabItem/SelectionItem, one Tab stop, OS arrows/mouse, disabled behavior, updates, controlled rejection, and unmount/remount. Does not establish structural insertion/reordering, rich-slot geometry, overflow resizing, or final fresh-install core20 qualification.'}elseif($LayerFocusActions){'Nested useLayer focus/close: outer and inner anchored layers, child close and Escape restore focus into the parent, parent close restores the outer trigger; secondary windows and modal focus remain separate.'}elseif($LayerActions){'Direct useLayer anchored context layer: declared Screen/RootLayout host, trigger geometry and anchored-below surface peer, Layer action Invoke/activation, exactly-once open/dismissal via button/outside/Escape, controlled isOpen rejection, disabled trigger, remount and narrow resize. Fixed/custom placements, RTL and focus-return specifics remain separate.'}elseif($TableActions){'Public Table sortable-header input prerequisite: one Button/Invoke peer named Sort by Name, Tab/Enter/Space/mouse/Invoke exactly-once sort cycle, controlled acceptance/rejection, current callback, prop/remount/resize and peer/drawing geometry. Table structure, scrolling and the full sort/plugin matrix remain separate.'}elseif($DisplayActions){'ClickableCard, Banner end action and dismissal: real Tab/Enter/Space/mouse/Invoke, exactly-once callbacks, current revision, unmount/remount, frame alignment, resize and applicable disabled rejection. Does not replace display content/geometry qualification.'}elseif($Core20Structure){'Core20 structure gates: layout cases (text/vstack/hstack/stack/view/center/section/shrink) named peers, finite bounds, ordered children, padding/gap/alignment, narrow reflow, revision/remount; display cases (card/badge/avatar/banner) named peers and content. One packaged MSIX.'}elseif($ServiceActions){'Windows service adapters on the packaged runtime: clipboard Unicode/empty/nontext roundtrip, CSPRNG bounds/uniqueness/error paths, storage set/get/remove/control-chars + cross-launch persistence, keep-awake grant/release/tag cleanup, connectivity state+subscription, device/app-info identity, file service text/binary/chunk/abort/pick/export/release, secure-storage Credential Locker read/write/remove + cross-launch persistence, bounded auth unavailability, primary-window DIP metrics, and core File/Folder exists/fromPath/nested/temp/cleanup. Narrator, ARM64, roaming, suspend/resume, access policy and downstream consumers remain separate.'}elseif($TextInputActions){'Public TextInput/TextArea on real WinUI fields: physical typing, onChange sequence, changed/unchanged controlled writes, OS selection preservation + shrink clamp, secure PasswordBox peer, readonly/disabled rejection, focus transitions and blur/focus events, form editing order, consumed vs submitting Return, raw keyDown/keyUp payloads, held-key repeat, independent owners, unmount disposal and remount listener reattach. IME composition, secondary windows and architectures remain separate.'}elseif($ScrollActions){'useScrollableArea custom viewport on real Mason WinUI: initial overflow edge state, physical wheel scroll to/away from edges, content shrink and growth republishing state, viewport bounds after window resize, unmount disposal and remount observer restore. Touch/pen, keyboard-scroll access, RTL, both-axis and callback-order specifics remain separate.'}elseif($ListItemActions){'ListItem input prerequisite: real Tab/Shift+Tab/Enter/Space/mouse/Invoke, exactly-once callbacks, current revision, unmount/remount, peer/drawing frames, resize and disabled rejection. Does not qualify List/ListItem structural roles, slot geometry, navigation or the wider props matrix; final core20 gates remain pending.'}else{'Action shape, sibling gap/order, native-peer frame alignment, resize, real Tab/Enter/Space/mouse/Invoke, prop updates, implicit names, unmount/remount, disabled focus/keys/Tab/mouse/Invoke, Link injected navigation callback. Diagnostic source build; final clean-main core20 qualification remains pending.'})
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
 if($MenuActions){
  Check-MenuActions
 }elseif($TableActions){
  Check-TableSortActions
 }elseif($LayerActions){
  Check-LayerActions
 }elseif($LayerFocusActions){
  Check-LayerFocusActions
 }elseif($SelectorActions){
  Check-SelectorActions
 }elseif($TabActions){
  Check-TabActions
 }elseif($DisplayActions){
  Check-DisplayActions
 }elseif($ListItemActions){
  Check-ListItemActions
 }elseif($Core20Structure){
  Check-Core20Structure
 }elseif($ServiceActions){
  Check-ServiceActions
 }elseif($TextInputActions){
  Check-TextInputActions
 }elseif($ScrollActions){
  Check-ScrollActions
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
