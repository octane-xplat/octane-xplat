# Run in the signed-in Windows desktop session under the device/desktop-input lease.
# Action qualification driver. Fixture commands never activate controls or navigate to the target.
param(
 [Parameter(Mandatory)][ValidatePattern('^[a-f0-9]{40}$')][string]$ExpectedCommit,
 [Parameter(Mandatory)][version]$ExpectedPackageVersion,
 [Parameter(Mandatory)][string]$OutputDirectory,
 [switch]$AllowDirtyProbe
)
$ErrorActionPreference='Stop'
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
 foreach($line in $lines){
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
  if(-not $client.HasExited){$client.Kill();$client.WaitForExit()}
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
  if(-not $client.HasExited){$client.Kill();$client.WaitForExit()}
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
$report=[ordered]@{
 schemaVersion=1;packageVersion=$pkg.Version.ToString();packageFamilyName=$pkg.PackageFamilyName
 driverSha256=(Get-FileHash -LiteralPath $PSCommandPath -Algorithm SHA256).Hash
 actionHelperSha256=(Get-FileHash -LiteralPath (Join-Path $PSScriptRoot 'action-uia.ps1') -Algorithm SHA256).Hash
 readerSha256=(Get-FileHash -LiteralPath (Join-Path $PSScriptRoot 'capture-uia.ps1') -Algorithm SHA256).Hash
 expectedCommit=$ExpectedCommit;allowDirtyProbe=[bool]$AllowDirtyProbe
 scope='Action shape, sibling gap/order, native-peer frame alignment, resize, real Tab/Enter/Space/mouse/Invoke, prop updates, implicit names, unmount/remount, disabled focus/keys/Tab/mouse/Invoke, Link injected navigation callback. Diagnostic source build; final clean-main core20 qualification remains pending.'
 qualification='pending';source=$null;launchId=$null;architecture=$pkg.Architecture.ToString();masonSha256=$null;preflightChecks=$null;cases=$script:Cases;error=$null
}
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
   $entry.checks=@($script:Checks.ToArray());$script:Cases.Add([pscustomobject]$entry)
   Command 'disabled' $false|Out-Null
   Command 'implicit-names' $false|Out-Null
   Command 'revision' 0|Out-Null
   Command 'mounted' $true|Out-Null
   Command 'routed-link' $false|Out-Null
   [Core20Desktop]::MoveWindow($windowHandle,$left,$top,$wideWidth,$height,$true)|Out-Null
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
