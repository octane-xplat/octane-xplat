param([string]$Directory, [string]$Runtime, [string]$Identity)
# In-session journey driver for the Windows desktop-shell app. Runs inside the
# interactive session (scheduled task) so SendInput and UIA reach the desktop.
# Emits STEP|name|inputClass|result|detail lines that windows.ts parses.
$ErrorActionPreference='Stop'
$ProgressPreference='SilentlyContinue'
$dir=$Directory

function Step([string]$name,[string]$class,[string]$result,[string]$detail=''){ "STEP|$name|$class|$result|$($detail -replace '[\r\n|]',' ')" }

function Stage([string]$label,[string]$version){
  $target="$dir\$label"
  New-Item -ItemType Directory -Force $target | Out-Null
  & robocopy $Runtime $target /E /R:0 /W:0 /NFL /NDL /NJH /NJS /NP | Out-Null
  Get-ChildItem "$target\app" | Remove-Item -Recurse -Force
  Expand-Archive -Path "$dir\app-$label.zip" -DestinationPath "$target\app" -Force | Out-Null
  $manifest="$target\AppxManifest.xml"
  [xml]$xml=Get-Content $manifest
  $xml.Package.Identity.Name=$Identity
  $xml.Package.Identity.Version=$version
  # Keep Package.Extensions: they register the NativeScript.Widgets and
  # NativeScript.Mason in-process WinRT classes the renderer activates.
  $xml.Save($manifest)
  Write-Host "HASH $label manifest=$((Get-FileHash $manifest -Algorithm SHA256).Hash) bundle=$((Get-FileHash "$target\app\bundle.mjs" -Algorithm SHA256).Hash) exe=$((Get-FileHash "$target\windows.exe" -Algorithm SHA256).Hash)"
  return $manifest
}

Add-Type -AssemblyName UIAutomationClient,UIAutomationTypes
Add-Type @'
using System;using System.Runtime.InteropServices;
public static class J {
[DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr h);
[DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
[DllImport("user32.dll")] public static extern bool SetProcessDPIAware();
[DllImport("user32.dll")] public static extern bool SetCursorPos(int x,int y);
[DllImport("user32.dll")] public static extern void mouse_event(uint f,uint x,uint y,uint d,UIntPtr e);
[DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr h, out uint pid);
[StructLayout(LayoutKind.Explicit,Size=40)] public struct Input {
 [FieldOffset(0)] public uint type;
 [FieldOffset(8)] public ushort vk;
 [FieldOffset(10)] public ushort scan;
 [FieldOffset(12)] public uint flags;
}
[DllImport("user32.dll",SetLastError=true)] static extern uint SendInput(uint n, Input[] inputs, int size);
static void Send(Input i){ if(SendInput(1,new[]{i},40)!=1) throw new Exception("SendInput failed"); System.Threading.Thread.Sleep(60); }
public static void Key(ushort scan, bool up, bool ext){ Send(new Input{ type=1, scan=scan, flags=(uint)(8|(up?2:0)|(ext?1:0)) }); }
public static void Tap(ushort scan){ Key(scan,false,false); Key(scan,true,false); }
public static void Chord(ushort scan, bool ctrl, bool shift, bool alt){
 // Injected chords use right Ctrl unless Alt is held (left Ctrl+Alt), the
 // path the app-menu Windows runtime test pins for WinUI accelerators.
 bool ext=ctrl && !alt;
 if(ctrl) Key(29,false,ext); if(shift) Key(42,false,false); if(alt) Key(56,false,false);
 Tap(scan);
 if(alt) Key(56,true,false); if(shift) Key(42,true,false); if(ctrl) Key(29,true,ext);
}
public static void Type(string s){ foreach(char c in s){ Send(new Input{ type=1, scan=c, flags=4 }); Send(new Input{ type=1, scan=c, flags=6 }); } }
public static void Click(int x,int y,bool right){ SetCursorPos(x,y); System.Threading.Thread.Sleep(150); mouse_event(right?8u:2u,0,0,0,UIntPtr.Zero); System.Threading.Thread.Sleep(60); mouse_event(right?16u:4u,0,0,0,UIntPtr.Zero); System.Threading.Thread.Sleep(400); }
public static uint ForegroundPid(){ uint pid; GetWindowThreadProcessId(GetForegroundWindow(), out pid); return pid; }
}
'@
[J]::SetProcessDPIAware() | Out-Null
$UIA=[System.Windows.Automation.AutomationElement]
$Scope=[System.Windows.Automation.TreeScope]
$root=$UIA::RootElement

function ById($scopeEl,[string]$id){ $scopeEl.FindFirst($Scope::Descendants,(New-Object System.Windows.Automation.PropertyCondition($UIA::AutomationIdProperty,$id))) }
function ByType($scopeEl,$type){ $scopeEl.FindFirst($Scope::Descendants,(New-Object System.Windows.Automation.PropertyCondition($UIA::ControlTypeProperty,$type))) }
function ContentButton($scopeEl,[string]$name){
  $all=$scopeEl.FindAll($Scope::Descendants,(New-Object System.Windows.Automation.AndCondition((New-Object System.Windows.Automation.PropertyCondition($UIA::NameProperty,$name)),(New-Object System.Windows.Automation.PropertyCondition($UIA::ControlTypeProperty,[System.Windows.Automation.ControlType]::Button)))))
  foreach($el in $all){ if($el.Current.AutomationId -ne $name){ return $el } }
  return $null
}
function Dump($scopeEl,[string]$label,[int]$max=60){
  $all=$scopeEl.FindAll($Scope::Descendants,[System.Windows.Automation.Condition]::TrueCondition)
  $i=0; foreach($el in $all){ if($i -ge $max){ break }; "TREE $label $(Describe $el)"; $i++ }
}
function ByName($scopeEl,[string]$name){ $scopeEl.FindFirst($Scope::Descendants,(New-Object System.Windows.Automation.PropertyCondition($UIA::NameProperty,$name))) }
function Describe($el){
  if(-not $el){ return 'missing' }
  try {
    $r=$el.Current.BoundingRectangle
    $rect=if($r.IsEmpty -or [double]::IsInfinity($r.X)){ 'empty' } else { "$([int]$r.X),$([int]$r.Y),$([int]$r.Width),$([int]$r.Height)" }
    "type=$($el.Current.ControlType.ProgrammaticName) id=$($el.Current.AutomationId) name=$($el.Current.Name) rect=$rect"
  } catch { "element unavailable ($($_.Exception.GetType().Name))" }
}
function ClickEl($el,[bool]$right=$false){ $r=$el.Current.BoundingRectangle; [J]::Click([int]($r.X+$r.Width/2),[int]($r.Y+$r.Height/2),$right) }
function Log(){ if(Test-Path $script:log){ Get-Content $script:log -Raw -ErrorAction SilentlyContinue } else { '' } }
function WaitLog([string]$pattern,[int]$ms=8000){ $d=(Get-Date).AddMilliseconds($ms); do { if((Log) -match $pattern){ return $true }; Start-Sleep -Milliseconds 250 } while((Get-Date) -lt $d); return $false }
function Count([string]$pattern){ ([regex]::Matches((Log),$pattern)).Count }
function AppProcess([string]$label){ Get-Process windows -ErrorAction SilentlyContinue | Where-Object { $_.Path -eq "$dir\$label\windows.exe" } }
function MainWindow([string]$label){
  $d=(Get-Date).AddSeconds(30)
  do { $p=AppProcess $label | Select-Object -First 1; if($p -and $p.MainWindowHandle -ne 0){ return $UIA::FromHandle($p.MainWindowHandle) }; Start-Sleep -Milliseconds 300 } while((Get-Date) -lt $d)
  return $null
}
function Front($win){ if($win){ [J]::SetForegroundWindow([IntPtr]$win.Current.NativeWindowHandle) | Out-Null; Start-Sleep -Milliseconds 500 } }
function Launch($pkg){ Start-Process explorer.exe -ArgumentList "shell:AppsFolder\$($pkg.PackageFamilyName)!App" }
function OpenInspectorFromMenu($win,[string]$marker){
  Front $win
  $menu=ByName $win 'Journey'
  if(-not $menu){ return 'Journey menu not in UIA' }
  ClickEl $menu; Start-Sleep -Milliseconds 700
  $item=ByName $root 'Open Inspector'
  if(-not $item){ [J]::Tap(1); return 'Open Inspector menu item missing' }
  $described=Describe $item
  ClickEl $item
  if(WaitLog $marker 2500){ return "os-input: menu click $described" }
  # The mouse click did not reach the item; fall back to UIA Invoke so the
  # lifecycle steps still run, and label the open path accordingly.
  [J]::Tap(1); Start-Sleep -Milliseconds 300
  ClickEl $menu; Start-Sleep -Milliseconds 700
  $item=ByName $root 'Open Inspector'
  try { $item.GetCurrentPattern([System.Windows.Automation.InvokePattern]::Pattern).Invoke() } catch { return "click missed ($described) and Invoke failed: $_" }
  return "uia-invoke after click missed ($described)"
}
function OpenInspectorFromTray([string]$label){
  # The app logs the worker's Shell_NotifyIconGetRect box (test-only hook) so
  # the right-click lands on the real icon; the click itself is SendInput.
  $m=[regex]::Match((Log),'TRAY_RECT (-?\d+),(-?\d+),(-?\d+),(-?\d+)')
  if(-not $m.Success){ return "icon rect unavailable: no TRAY_RECT marker, and the managed UIA client exposes no notification-area buttons in the Windows 11 XAML taskbar, so there is no aimed OS-input path to the icon" }
  $l=[int]$m.Groups[1].Value; $t=[int]$m.Groups[2].Value; $r=[int]$m.Groups[3].Value; $b=[int]$m.Groups[4].Value
  [J]::Click([int](($l+$r)/2),[int](($t+$b)/2),$true)
  Start-Sleep -Milliseconds 900
  $item=ByName $root 'Open Inspector'
  if(-not $item){ [J]::Tap(1); return "context menu item missing after right-click at rect $l,$t,$r,$b" }
  ClickEl $item
  return "right-click at rect $l,$t,$r,$b then $(Describe $item)"
}

$pkg=$null
$script:log=$null
try {
  $m1=Stage 'v1' '1.0.0.0'
  Add-AppxPackage -Register $m1 -ForceUpdateFromAnyVersion
  $pkg=Get-AppxPackage -Name $Identity
  "PACKAGE $($pkg.PackageFullName)"
  $script:log=Join-Path $env:LOCALAPPDATA "Packages\$($pkg.PackageFamilyName)\LocalState\console.log"
  Remove-Item $script:log -ErrorAction SilentlyContinue
  Step 'install v1 (Add-AppxPackage -Register)' 'in-process' 'pass' $pkg.PackageFullName

  Launch $pkg
  $ready=WaitLog 'JOURNEY READY' 40000
  $win=MainWindow 'v1'
  if($ready -and $win){ Step 'launch installed package -> READY' 'in-process' 'pass' (Describe $win) } else {
    Step 'launch installed package -> READY' 'in-process' 'fail' "ready=$ready window=$([bool]$win)"
    "PROCESS $((AppProcess 'v1' | ForEach-Object { "pid=$($_.Id) title=$($_.MainWindowTitle) hwnd=$($_.MainWindowHandle)" }) -join '; ')"
    "LOGPATH $script:log exists=$(Test-Path $script:log)"
    (Log) -split "`n" | ForEach-Object { "APPLOG v1 $_" }
    throw 'launch failed; remaining steps depend on a running app'
  }
  if((Log) -match 'JOURNEY RESTORED none'){ Step 'v1 starts without stored name' 'in-process' 'pass' } else { Step 'v1 starts without stored name' 'in-process' 'fail' 'unexpected RESTORED' }

  Front $win
  # WinUI exposes no AutomationId for testID on this host (finding); match by
  # control type and visible name instead, and record which path matched.
  $field=ById $win 'journey-name'; if(-not $field){ $field=ByType $win ([System.Windows.Automation.ControlType]::Edit) }
  $submit=ById $win 'journey-submit'; if(-not $submit){ $submit=ContentButton $win 'Submit' }
  $status=ById $win 'journey-status'; if(-not $status){ $status=ByName $win 'Waiting for a name' }
  if(-not $field -or -not $submit){ Dump $win 'main' }
  "UIA field $(Describe $field)"; "UIA submit $(Describe $submit)"; "UIA status $(Describe $status)"
  if($submit -and $submit.Current.ControlType.ProgrammaticName -eq 'ControlType.Button'){ Step 'uia: submit is Button' 'uia' 'pass' (Describe $submit) } else { Step 'uia: submit is Button' 'uia' 'fail' (Describe $submit) }
  if($field -and $field.Current.ControlType.ProgrammaticName -eq 'ControlType.Edit'){ Step 'uia: name field is Edit' 'uia' 'pass' (Describe $field) } else { Step 'uia: name field is Edit' 'uia' 'fail' (Describe $field) }

  if($field -and $submit){
    ClickEl $field; [J]::Type('Ada'); Start-Sleep -Milliseconds 300
    ClickEl $submit
    if(WaitLog 'SUBMITTED name=Ada'){ Step 'form: type + click Submit' 'os-input-sendinput' 'pass' } else { Step 'form: type + click Submit' 'os-input-sendinput' 'fail' 'no SUBMITTED name=Ada' }
    $before=Count 'SUBMITTED name=Ada'
    ClickEl $field; [J]::Tap(15); Start-Sleep -Milliseconds 400
    $focused=$UIA::FocusedElement
    $fid="$($focused.Current.ControlType.ProgrammaticName):$($focused.Current.Name)"
    [J]::Tap(57); Start-Sleep -Milliseconds 600
    $after=Count 'SUBMITTED name=Ada'
    if($fid -eq 'ControlType.Button:Submit' -and $after -gt $before){ Step 'keyboard: Tab -> Submit, Space activates' 'os-input-sendinput' 'pass' "focused=$fid" } else { Step 'keyboard: Tab -> Submit, Space activates' 'os-input-sendinput' 'fail' "focused=$fid submits $before->$after" }
  } else {
    Step 'form: type + click Submit' 'os-input-sendinput' 'blocked' 'controls not found in UIA'
    Step 'keyboard: Tab -> Submit, Space activates' 'os-input-sendinput' 'blocked' 'controls not found in UIA'
  }

  Front $win
  if($status){ ClickEl $status }
  $c0=Count 'JOURNEY MENU action=increment'
  [J]::Chord(23,$true,$true,$false); Start-Sleep -Milliseconds 600
  if((Count 'JOURNEY MENU action=increment') -gt $c0){ Step 'app menu: accelerator Ctrl+Shift+I' 'os-input-sendinput' 'pass' } else { Step 'app menu: accelerator Ctrl+Shift+I' 'os-input-sendinput' 'fail' 'no MENU marker' }

  $menu=ByName $win 'Journey'
  "UIA menu $(Describe $menu)"
  if($menu){
    $c1=Count 'JOURNEY MENU action=increment'
    ClickEl $menu; Start-Sleep -Milliseconds 700
    $item=ByName $root 'Increment Counter'
    "UIA menu-item $(Describe $item)"
    if($item){ ClickEl $item; Start-Sleep -Milliseconds 600 }
    if((Count 'JOURNEY MENU action=increment') -gt $c1){ Step 'app menu: mouse Journey > Increment Counter' 'os-input-sendinput' 'pass' } else { Step 'app menu: mouse Journey > Increment Counter' 'os-input-sendinput' 'fail' (Describe $item) }
    $c2=Count 'JOURNEY MENU action=increment'
    ClickEl $menu; Start-Sleep -Milliseconds 700
    $item=ByName $root 'Increment Counter'
    try { $item.GetCurrentPattern([System.Windows.Automation.InvokePattern]::Pattern).Invoke(); Start-Sleep -Milliseconds 600 } catch { "UIA invoke error $_" }
    if((Count 'JOURNEY MENU action=increment') -gt $c2){ Step 'app menu: UIA Invoke Increment Counter' 'uia-pattern' 'pass' } else { Step 'app menu: UIA Invoke Increment Counter' 'uia-pattern' 'fail' (Describe $item) }
    [J]::Tap(1)
  } else {
    Step 'app menu: mouse Journey > Increment Counter' 'os-input-sendinput' 'fail' 'Journey menu not in UIA'
    Step 'app menu: UIA Invoke Increment Counter' 'uia-pattern' 'blocked' 'Journey menu not in UIA'
  }

  if((Log) -match 'JOURNEY TRAY_OK'){
    $detail=OpenInspectorFromTray 'v1'
    if(WaitLog 'INSPECTOR_OPENED id=w1'){ Step 'tray: right-click icon > Open Inspector' 'os-input-sendinput' 'pass' $detail }
    elseif($detail -like 'icon rect unavailable*'){ Step 'tray: right-click icon > Open Inspector' 'os-input-sendinput' 'blocked' $detail }
    else { Step 'tray: right-click icon > Open Inspector' 'os-input-sendinput' 'fail' $detail }
  } else {
    Step 'tray: right-click icon > Open Inspector' 'os-input-sendinput' 'blocked' ((Log) -split "`n" | Select-String 'TRAY_ERROR' | Select-Object -First 1)
  }

  $via='tray'
  if(-not ((Log) -match 'INSPECTOR_OPENED id=w1')){
    $via='app menu'
    $detail=OpenInspectorFromMenu $win 'INSPECTOR_OPENED id=w1'
    $cls=if($detail -like 'uia-invoke*'){ 'uia-pattern' } else { 'os-input-sendinput' }
    if(WaitLog 'INSPECTOR_OPENED id=w1'){ Step 'window: open Inspector from app menu' $cls 'pass' $detail } else { Step 'window: open Inspector from app menu' $cls 'fail' $detail }
  }
  if((Log) -match 'INSPECTOR_OPENED id=w1'){
    Start-Sleep -Milliseconds 800
    $close=ById $root 'inspector-close'; if(-not $close){ $close=ContentButton $root 'Close' }
    "UIA inspector-close $(Describe $close)"
    if($close){ ClickEl $close }
    if(WaitLog 'INSPECTOR_CLOSED'){ Step 'window lifecycle: close Inspector with its button' 'os-input-sendinput' 'pass' (Describe $close) } else { Step 'window lifecycle: close Inspector with its button' 'os-input-sendinput' 'fail' (Describe $close) }
    $detail=if($via -eq 'tray'){ OpenInspectorFromTray 'v1' } else { OpenInspectorFromMenu $win 'INSPECTOR_OPENED id=w2' }
    $cls=if($detail -like 'uia-invoke*'){ 'uia-pattern' } else { 'os-input-sendinput' }
    if(WaitLog 'INSPECTOR_OPENED id=w2'){ Step "window lifecycle: reopen from $via" $cls 'pass' $detail } else { Step "window lifecycle: reopen from $via" $cls 'fail' $detail }
    Start-Sleep -Milliseconds 800
    $close=ById $root 'inspector-close'; if(-not $close){ $close=ContentButton $root 'Close' }
    if($close){ ClickEl $close }
    Start-Sleep -Milliseconds 800
    if((Count 'INSPECTOR_CLOSED') -ge 2){ Step 'window lifecycle: close reopened Inspector' 'os-input-sendinput' 'pass' } else { Step 'window lifecycle: close reopened Inspector' 'os-input-sendinput' 'fail' (Describe $close) }
  } else {
    foreach($n in 'window lifecycle: close Inspector with its button','window lifecycle: reopen','window lifecycle: close reopened Inspector'){ Step $n 'os-input-sendinput' 'blocked' 'Inspector never opened' }
  }

  if((Log) -match 'HOTKEY_REGISTERED focus-app'){
    Start-Process notepad.exe; Start-Sleep -Seconds 3
    $np=Get-Process notepad -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -ne 0 } | Select-Object -First 1
    $npWin=$null; if($np){ $npWin=$UIA::FromHandle($np.MainWindowHandle) }
    Front $npWin
    $fgBefore=[J]::ForegroundPid()
    $h0=Count 'JOURNEY HOTKEY_FOCUS'
    [J]::Chord(36,$true,$true,$true); Start-Sleep -Milliseconds 1200
    $app=AppProcess 'v1' | Select-Object -First 1
    $detail="foreground pid before=$fgBefore notepad=$($np.Id) after=$([J]::ForegroundPid()) app=$($app.Id)"
    if(-not $np -or $fgBefore -ne $np.Id){ Step 'global shortcut delivered with Notepad foreground' 'os-input-sendinput-background' 'blocked' "Notepad was not foreground: $detail" }
    elseif((Count 'JOURNEY HOTKEY_FOCUS') -gt $h0){
      Step 'global shortcut delivered with Notepad foreground' 'os-input-sendinput-background' 'pass' $detail
      if($app -and [J]::ForegroundPid() -eq $app.Id){ Step 'global shortcut brings app window to foreground' 'os-input-sendinput-background' 'pass' $detail } else { Step 'global shortcut brings app window to foreground' 'os-input-sendinput-background' 'fail' "Window.Activate() from the hotkey callback left another process in the foreground: $detail" }
    }
    else { Step 'global shortcut delivered with Notepad foreground' 'os-input-sendinput-background' 'fail' $detail }
    if($np){ Stop-Process -Id $np.Id -ErrorAction SilentlyContinue }
  } else {
    $why=((Log) -split "`n" | Select-String 'HOTKEY_' | Select-Object -First 3) -join ' '
    Step 'global shortcut delivered with Notepad foreground' 'os-input-sendinput-background' 'blocked' $why
  }
  $hk=((Log) -split "`n" | Select-String 'HOTKEY_(REGISTERED|ERROR)') -join ' '
  if($hk -match 'HOTKEY_ERROR conflict-probe' -and $hk -match 'HOTKEY_ERROR reserved-probe'){ Step 'hotkey conflict + reserved outcomes' 'in-process' 'pass' $hk } else { Step 'hotkey conflict + reserved outcomes' 'in-process' 'fail' $hk }

  Front $win
  if($status){ ClickEl $status }
  "PROCESS-BEFORE-QUIT $((AppProcess 'v1' | ForEach-Object { $_.Id }) -join ',')"
  [J]::Chord(16,$true,$false,$false)
  $quit=WaitLog 'QUIT_REQUESTED' 5000
  $clean=WaitLog 'CLEANUP menu=1 shortcuts=1 tray=1 residency=1' 8000
  $d=(Get-Date).AddSeconds(10); while((AppProcess 'v1') -and (Get-Date) -lt $d){ Start-Sleep -Milliseconds 300 }
  $exited=-not (AppProcess 'v1')
  if($quit -and $clean -and (Count 'JOURNEY CLEANUP') -eq 1){ Step 'quit Ctrl+Q: cleanup once' 'os-input-sendinput' 'pass' } else { Step 'quit Ctrl+Q: cleanup once' 'os-input-sendinput' 'fail' "quit=$quit cleanup=$clean count=$(Count 'JOURNEY CLEANUP')" }
  if($exited){ Step 'quit: process exits' 'in-process' 'pass' } else { Step 'quit: process exits' 'in-process' 'fail' 'still running 10s after exit/CLEANUP: core calls Application.Exit() only when the host reports ExitSupported' }
  if((Log) -match 'CLEANUP [^\r\n]*tray=1'){ Step 'quit: tray destroyed in cleanup' 'in-process' 'pass' } else { Step 'quit: tray destroyed in cleanup' 'in-process' 'fail' 'no tray=1 in CLEANUP' }
  Get-Content $script:log | ForEach-Object { "APPLOG v1 $_" }
  AppProcess 'v1' | Stop-Process -Force -ErrorAction SilentlyContinue

  $m2=Stage 'v2' '1.0.1.0'
  Add-AppxPackage -Register $m2 -ForceUpdateFromAnyVersion
  $pkg2=Get-AppxPackage -Name $Identity
  if($pkg2.Version -eq '1.0.1.0' -and $pkg2.PackageFamilyName -eq $pkg.PackageFamilyName){ Step 'install v2 over v1' 'in-process' 'pass' $pkg2.PackageFullName } else { Step 'install v2 over v1' 'in-process' 'fail' "$($pkg2.PackageFullName)" }
  $pkg=$pkg2
  Remove-Item $script:log -ErrorAction SilentlyContinue
  Launch $pkg
  $ready2=WaitLog 'JOURNEY READY' 40000
  if($ready2 -and (Log) -match 'JOURNEY VERSION 0\.2\.0'){ Step 'v2 version marker' 'in-process' 'pass' } else { Step 'v2 version marker' 'in-process' 'fail' "ready=$ready2" }
  if((Log) -match 'JOURNEY RESTORED name=Ada'){ Step 'v2 restores name from storage' 'in-process' 'pass' } else { Step 'v2 restores name from storage' 'in-process' 'fail' (((Log) -split "`n" | Select-String 'RESTORED') -join ' ') }
  $win2=MainWindow 'v2'
  Front $win2
  [J]::Chord(16,$true,$false,$false)
  $d=(Get-Date).AddSeconds(10); while((AppProcess 'v2') -and (Get-Date) -lt $d){ Start-Sleep -Milliseconds 300 }
  Get-Content $script:log | ForEach-Object { "APPLOG v2 $_" }
  AppProcess 'v2' | Stop-Process -Force -ErrorAction SilentlyContinue

  $state=Split-Path $script:log
  Remove-AppxPackage $pkg.PackageFullName
  $pkg=$null
  if(-not (Get-AppxPackage -Name $Identity)){ Step 'uninstall removes package' 'in-process' 'pass' } else { Step 'uninstall removes package' 'in-process' 'fail' }
  if(-not (Test-Path $state)){ Step 'uninstall removes LocalState (expected on Windows)' 'in-process' 'pass' } else { Step 'uninstall removes LocalState (expected on Windows)' 'in-process' 'fail' "$state still present" }
} finally {
  AppProcess 'v1' | Stop-Process -Force -ErrorAction SilentlyContinue
  AppProcess 'v2' | Stop-Process -Force -ErrorAction SilentlyContinue
  if($pkg){ Remove-AppxPackage $pkg.PackageFullName -ErrorAction SilentlyContinue }
}
exit 0
