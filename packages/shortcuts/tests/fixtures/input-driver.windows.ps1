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
public static class ShortcutInput {
[DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr h);
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
public static void RightControl(bool up) {
 var i=new Input {type=1,scan=29,flags=(uint)(9|(up?2:0))};
 if(SendInput(1,new[]{i},40)!=1) throw new Exception("SendInput failed");
 System.Threading.Thread.Sleep(70);
}
public static void Tap(ushort scan) { Key(scan,false);Key(scan,true); }
}
'@
$log=Join-Path $env:LOCALAPPDATA "Packages\$($pkg.PackageFamilyName)\LocalState\console.log"
Remove-Item $log -ErrorAction SilentlyContinue
Start-Process explorer.exe -ArgumentList "shell:AppsFolder\$($pkg.PackageFamilyName)!App"
$deadline=(Get-Date).AddSeconds(25)
do {
 Start-Sleep -Milliseconds 300
 $windows=[System.Windows.Automation.AutomationElement]::RootElement.FindAll([System.Windows.Automation.TreeScope]::Children,[System.Windows.Automation.Condition]::TrueCondition)
 $window=$windows | Where-Object {$_.Current.Name -eq 'XplatShortcuts'} | Select-Object -First 1
} while (-not $window -and (Get-Date) -lt $deadline)
if(-not $window){ if(Test-Path $log){Get-Content $log};throw 'No shortcuts window'}
[ShortcutInput]::SetForegroundWindow([IntPtr]$window.Current.NativeWindowHandle) | Out-Null
Start-Sleep -Milliseconds 1200
if(Test-Path $log){Get-Content $log}
[ShortcutInput]::RightControl($false);[ShortcutInput]::Tap(37);[ShortcutInput]::RightControl($true)
[ShortcutInput]::Tap(34);[ShortcutInput]::Tap(23);[ShortcutInput]::Tap(60)
[ShortcutInput]::RightControl($false);[ShortcutInput]::Key(42,$false);[ShortcutInput]::Tap(45);[ShortcutInput]::Key(42,$true);[ShortcutInput]::RightControl($true)
Start-Sleep -Milliseconds 700
[ShortcutInput]::Tap(61)
Start-Sleep -Milliseconds 300
[ShortcutInput]::Tap(44);[ShortcutInput]::Tap(45);[ShortcutInput]::Tap(88)
Start-Sleep -Milliseconds 300
[ShortcutInput]::RightControl($false);[ShortcutInput]::Tap(37);[ShortcutInput]::RightControl($true)
Start-Sleep -Milliseconds 300
$output = Get-Content $log -Raw
$output
if ($output -notmatch 'SHORTCUTS_WINDOWS_OK' -or $output -match 'SHORTCUTS_WINDOWS_FAIL') { throw 'Native fixture failed' }
if ([regex]::Matches($output,'SHORTCUT palette').Count -ne 1) { throw 'Disposed handler fired' }
} finally {
$own=Get-Process windows -ErrorAction SilentlyContinue | Where-Object {$_.Path -eq "$dir\runtime\windows.exe"}
$own | Stop-Process
if($pkg) { Remove-AppxPackage $pkg.PackageFullName }
}
exit 0
