param([string]$Directory, [string]$Runtime, [string]$Identity)
$ErrorActionPreference='Stop'
$ProgressPreference='SilentlyContinue'
$dir=$Directory
Get-Process windows -ErrorAction SilentlyContinue | Where-Object {$_.Path -eq "$dir\runtime\windows.exe"} | Stop-Process
$source=$Runtime
New-Item -ItemType Directory -Force "$dir\runtime" | Out-Null
& robocopy $source "$dir\runtime" /E /R:0 /W:0 /NFL /NDL /NJH /NJS /NP | Out-Null
Copy-Item "$dir\bundle.mjs" "$dir\runtime\app\bundle.mjs" -Force
'{"main":"bundle.mjs"}' | Set-Content "$dir\runtime\app\package.json"
$manifest="$dir\runtime\AppxManifest.xml"
[xml]$xml=Get-Content $manifest
$xml.Package.Identity.Name=$Identity
if($xml.Package.Extensions){[void]$xml.Package.RemoveChild($xml.Package.Extensions)}
$xml.Save($manifest)
try {
Add-AppxPackage -Register $manifest -ForceUpdateFromAnyVersion
$pkg=Get-AppxPackage -Name $Identity
Add-Type -AssemblyName UIAutomationClient,UIAutomationTypes
Add-Type @'
using System;using System.Runtime.InteropServices;
public static class GlobalHotkeyInput {
[DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr h);
[DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr h, int cmd);
[StructLayout(LayoutKind.Explicit,Size=40)] public struct Input {
 [FieldOffset(0)] public uint type;
 [FieldOffset(10)] public ushort scan;
 [FieldOffset(12)] public uint flags;
}
[DllImport("user32.dll",SetLastError=true)] static extern uint SendInput(uint n, Input[] inputs, int size);
public static void Key(ushort scan, bool up) {
 var i=new Input { type=1, scan=scan, flags=(uint)(8|(up?2:0)) };
 if(SendInput(1,new[]{i},40)!=1) throw new Exception("SendInput failed");
 System.Threading.Thread.Sleep(70);
}
public static void Chord() {
 // Ctrl (0x1d) + Alt (0x38) + K (0x25)
 Key(0x1d,false);Key(0x38,false);Key(0x25,false);Key(0x25,true);Key(0x38,true);Key(0x1d,true);
}
}
'@
$log=Join-Path $env:LOCALAPPDATA "Packages\$($pkg.PackageFamilyName)\LocalState\console.log"
Remove-Item $log -ErrorAction SilentlyContinue
Start-Process explorer.exe -ArgumentList "shell:AppsFolder\$($pkg.PackageFamilyName)!App"
$deadline=(Get-Date).AddSeconds(30)
do {
 Start-Sleep -Milliseconds 300
 $windows=[System.Windows.Automation.AutomationElement]::RootElement.FindAll([System.Windows.Automation.TreeScope]::Children,[System.Windows.Automation.Condition]::TrueCondition)
 $window=$windows | Where-Object {$_.Current.Name -eq 'XplatGlobalHotkeys'} | Select-Object -First 1
} while (-not $window -and (Get-Date) -lt $deadline)
if(-not $window){ if(Test-Path $log){Get-Content $log};throw 'No global-hotkeys window'}
# Wait for the fixture to finish registering, then take focus away.
$regDeadline=(Get-Date).AddSeconds(40)
do { Start-Sleep -Milliseconds 300; $out=(Test-Path $log) ? (Get-Content $log -Raw) : '' } while ($out -notmatch 'GHK registered' -and (Get-Date) -lt $regDeadline)
if($out -notmatch 'GHK registered'){ Get-Content $log; throw 'Registration never completed' }
[GlobalHotkeyInput]::ShowWindow([IntPtr]$window.Current.NativeWindowHandle,6) | Out-Null
Start-Sleep -Milliseconds 1500
# Two presses with our window minimized.
[GlobalHotkeyInput]::Chord()
Start-Sleep -Milliseconds 900
[GlobalHotkeyInput]::Chord()
Start-Sleep -Milliseconds 900
# Wait for the fixture to unregister, then prove no further delivery.
$unregDeadline=(Get-Date).AddSeconds(40)
do { Start-Sleep -Milliseconds 300; $out=(Test-Path $log) ? (Get-Content $log -Raw) : '' } while ($out -notmatch 'GHK unregistered' -and (Get-Date) -lt $unregDeadline)
if($out -notmatch 'GHK unregistered'){ Get-Content $log; throw 'Fixture never unregistered' }
[GlobalHotkeyInput]::Chord()
Start-Sleep -Milliseconds 3000
$output = Get-Content $log -Raw
$output
if ($output -notmatch 'GHK_WINDOWS_OK' -or $output -match 'GHK_WINDOWS_FAIL') { throw 'Native fixture failed' }
} finally {
$own=Get-Process windows -ErrorAction SilentlyContinue | Where-Object {$_.Path -eq "$dir\runtime\windows.exe"}
$own | Stop-Process
if($pkg) { Remove-AppxPackage $pkg.PackageFullName }
}
exit 0
