# Run in the signed-in Windows desktop session under the device/desktop-input lease.
# This driver changes fixture props through a file; UIA and window APIs collect evidence.
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
$report=[ordered]@{
 schemaVersion=1;packageVersion=$pkg.Version.ToString();packageFamilyName=$pkg.PackageFamilyName
 driverSha256=(Get-FileHash -LiteralPath $PSCommandPath -Algorithm SHA256).Hash
 readerSha256=(Get-FileHash -LiteralPath (Join-Path $PSScriptRoot 'capture-uia.ps1') -Algorithm SHA256).Hash
 expectedCommit=$ExpectedCommit;allowDirtyProbe=[bool]$AllowDirtyProbe
 scope='Seven layout/text fixtures and the maintained fixed-width shrink regression; action, display, collection and navigation checks remain separate.'
 qualification='pending';source=$null;launchId=$null;architecture=$pkg.Architecture.ToString();masonSha256=$null;preflightChecks=$null;cases=$script:Cases;error=$null
}
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
 $labels=@{vstack='Vertical';hstack='Horizontal';stack='Stack';view='View';center='Center';section='Section'}
 foreach($case in @('text','vstack','hstack','stack','view','center','section','shrink')){
  $script:Checks.Clear()
  $entry=[ordered]@{case=$case;status='running';checks=$null;error=$null}
  try {
   if(-not [Core20Desktop]::MoveWindow($windowHandle,$left,$top,$wideWidth,$height,$true)){throw 'Cannot set the wide window size'}
   Command 'scene' 'layout'|Out-Null
   Command 'case' $case|Out-Null
   Command 'revision' 0|Out-Null
   Command 'mounted' $true|Out-Null
   Status-Contains "case=$case "
   Status-Contains 'revision=0 mounted=true'
   $baseline=Capture "$case-default"
   $native=Snapshot "$case-default"
   Check-Layout $case $baseline $native
   if($case -eq 'shrink'){
    Command 'mounted' $false|Out-Null
    Status-Contains 'mounted=false'
    Capture 'shrink-unmounted'|Out-Null
    $unmounted=Snapshot 'shrink-unmounted'
    Assert (@($unmounted|Where-Object {$_.className -match 'parity-shrink-'}).Count -eq 0) 'Unmount removes the maintained shrink fixture'
    Command 'mounted' $true|Out-Null
    Status-Contains 'mounted=true'
    $remounted=Capture 'shrink-remounted'
    $nativeRemount=Snapshot 'shrink-remounted'
    Check-Layout $case $remounted $nativeRemount
    $entry.status='assertions-passed'
    continue
   }
   Command 'revision' 1|Out-Null
   Status-Contains 'revision=1 mounted=true'
   $updated=Capture "$case-updated"
   $updatedName=if($case -eq 'text'){'Updated typography should wrap within the available space.'}else{$labels[$case]+' 1'}
   $updatedNode=Named $updated $updatedName
   Assert (Finite $updatedNode) 'Updated accessible name has visible bounds'
   Command 'mounted' $false|Out-Null
   Status-Contains 'mounted=false'
   $unmounted=Capture "$case-unmounted"
   Assert (@($unmounted|Where-Object {$_.name -ceq $updatedName}).Count -eq 0) 'Unmount removes the component from UIA'
   Command 'revision' 0|Out-Null
   Command 'mounted' $true|Out-Null
   Status-Contains 'revision=0 mounted=true'
   $remounted=Capture "$case-remounted"
   $nativeRemount=Snapshot "$case-remounted"
   Check-Layout $case $remounted $nativeRemount
   if(-not [Core20Desktop]::MoveWindow($windowHandle,$left,$top,$narrowWidth,$height,$true)){throw 'Cannot resize the owned window'}
   $resized=Capture "$case-resized"
   $nativeResized=Snapshot "$case-resized"
   $id="core20-$case"
   $before=Native-Id $nativeRemount $id
   $after=Native-Id $nativeResized $id
   Assert ($after.box.width -lt $before.box.width) 'Window resize reduces the responsive component width' @{before=$before.box.width;after=$after.box.width}
   Check-Reflow $case $resized $nativeResized
   if($case -eq 'text'){
    $text=Named $resized 'Shared typography should wrap within the available space.'
    Assert ((Finite $text) -and $text.height -gt (Named $remounted $text.name).height) 'Narrower window produces additional wrapped lines' $text.height
   }
   $entry.status='assertions-passed'
  }catch{
   $entry.status='failed'
   $entry.error=$_.Exception.Message
  }finally{
   $entry.checks=@($script:Checks.ToArray())
   $script:Cases.Add([pscustomobject]$entry)
  }
 }
 if(@($script:Cases|Where-Object {$_.status -ne 'assertions-passed'}).Count -gt 0){throw 'One or more layout cases failed; inspect result.json'}
 $report.qualification='pending-completion-audit'
} catch {
 $report.error=$_.Exception.Message
 } finally {
 $cleanupErrors=[Collections.Generic.List[string]]::new()
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
