param([string]$Directory, [string]$Runtime, [string]$Identity)
$ErrorActionPreference='Stop'
$ProgressPreference='SilentlyContinue'
$dir=$Directory
"STAGE robocopy $Runtime"
New-Item -ItemType Directory -Force "$dir\runtime" | Out-Null
& robocopy $Runtime "$dir\runtime" /E /R:0 /W:0 /NFL /NDL /NJH /NJS /NP | Out-Null
"STAGE robocopy-done rc=$LASTEXITCODE"
Get-ChildItem "$dir\runtime\app" | Remove-Item -Recurse -Force
Copy-Item "$dir\bundle.mjs" "$dir\runtime\app\bundle.mjs" -Force
'{"main":"bundle.mjs"}' | Set-Content "$dir\runtime\app\package.json"
$manifest="$dir\runtime\AppxManifest.xml"
[xml]$xml=Get-Content $manifest
$xml.Package.Identity.Name=$Identity
if($xml.Package.Extensions){[void]$xml.Package.RemoveChild($xml.Package.Extensions)}
$xml.Save($manifest)
"STAGE manifest-saved"
Add-Type -AssemblyName UIAutomationClient,UIAutomationTypes
Add-Type @'
using System;using System.Runtime.InteropServices;
public static class MenuInput {
[DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr h);
[DllImport("user32.dll")] public static extern bool SetProcessDPIAware();
[DllImport("user32.dll")] public static extern bool SetCursorPos(int x,int y);
[DllImport("user32.dll")] public static extern void mouse_event(uint f,uint x,uint y,uint d,UIntPtr e);
[StructLayout(LayoutKind.Explicit,Size=40)] public struct Input {
 [FieldOffset(0)] public uint type;
 [FieldOffset(10)] public ushort scan;
 [FieldOffset(12)] public uint flags;
}
[DllImport("user32.dll",SetLastError=true)] static extern uint SendInput(uint n, Input[] inputs, int size);
public static void Key(ushort scan, bool up, bool ext) {
 var i=new Input { type=1, scan=scan, flags=(uint)(8|(up?2:0)|(ext?1:0)) };
 if(SendInput(1,new[]{i},40)!=1) throw new Exception("SendInput failed");
 System.Threading.Thread.Sleep(70);
}
public static void Ctrl(ushort scan, bool shift, bool alt) {
 // Pinned injected-key path: right Ctrl for ordinary chords, left Ctrl+Alt.
 Key(29,false,!alt); if(shift) Key(42,false,false); if(alt) Key(56,false,false);
 Key(scan,false,false); Key(scan,true,false);
 if(alt) Key(56,true,false); if(shift) Key(42,true,false); Key(29,true,!alt);
}
public static void Click(int x,int y){ SetCursorPos(x,y); System.Threading.Thread.Sleep(150); mouse_event(2,0,0,0,UIntPtr.Zero); System.Threading.Thread.Sleep(60); mouse_event(4,0,0,0,UIntPtr.Zero); System.Threading.Thread.Sleep(400); }
}
'@
[MenuInput]::SetProcessDPIAware() | Out-Null
$pkg=$null
try {
"STAGE appx-register"
Add-AppxPackage -Register $manifest -ForceUpdateFromAnyVersion
"STAGE appx-registered"
$pkg=Get-AppxPackage -Name $Identity
$log=Join-Path $env:LOCALAPPDATA "Packages\$($pkg.PackageFamilyName)\LocalState\console.log"
Remove-Item $log -ErrorAction SilentlyContinue
"STAGE launch"
Start-Process explorer.exe -ArgumentList "shell:AppsFolder\$($pkg.PackageFamilyName)!App"
"STAGE launched"
$root=[System.Windows.Automation.AutomationElement]::RootElement
$deadline=(Get-Date).AddSeconds(25)
do { Start-Sleep -Milliseconds 300
 $window=$root.FindFirst([System.Windows.Automation.TreeScope]::Children,(New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::NameProperty,'XplatAppMenu')))
} while (-not $window -and (Get-Date) -lt $deadline)
if(-not $window){ if(Test-Path $log){Get-Content $log}; throw 'No window' }
[MenuInput]::SetForegroundWindow([IntPtr]$window.Current.NativeWindowHandle) | Out-Null
Start-Sleep -Milliseconds 1500
function Find([string]$name){ $root.FindFirst([System.Windows.Automation.TreeScope]::Descendants,(New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::NameProperty,$name))) }
function Report([string]$label,$el){ if($el){ $r=$el.Current.BoundingRectangle; "UIA $label type=$($el.Current.ControlType.ProgrammaticName) rect=$($r.X),$($r.Y),$($r.Width),$($r.Height) offscreen=$($el.Current.IsOffscreen) enabled=$($el.Current.IsEnabled)" } else { "UIA $label missing" } }
$w=$window.Current.BoundingRectangle; "UIA window rect=$($w.X),$($w.Y),$($w.Width),$($w.Height)"
$file=Find 'File'; Report 'File' $file
if($file){ $r=$file.Current.BoundingRectangle; [MenuInput]::Click([int]($r.X+$r.Width/2),[int]($r.Y+$r.Height/2)); Start-Sleep -Milliseconds 700
 $new=Find 'New'; Report 'New-after-open' $new
 $recent=Find 'Recent'; Report 'Recent' $recent
 $dis=Find 'Disabled'; Report 'Disabled' $dis
 if($new){ $r=$new.Current.BoundingRectangle; if($r.Width -gt 0){ [MenuInput]::Click([int]($r.X+$r.Width/2),[int]($r.Y+$r.Height/2)) } }
 Start-Sleep -Milliseconds 500
 "AFTER-POINTER"; Get-Content $log | Select-String 'CLICK'
}
[MenuInput]::SetForegroundWindow([IntPtr]$window.Current.NativeWindowHandle) | Out-Null
Start-Sleep -Milliseconds 400
# Ctrl+N, Ctrl+Shift+S, Ctrl+D, Ctrl+Alt+K (submenu accel), Ctrl+U update
[MenuInput]::Ctrl(49,$false,$false); Start-Sleep -Milliseconds 300
[MenuInput]::Ctrl(31,$true,$false); Start-Sleep -Milliseconds 300
[MenuInput]::Ctrl(32,$false,$false); Start-Sleep -Milliseconds 300
[MenuInput]::Ctrl(37,$false,$true); Start-Sleep -Milliseconds 300
[MenuInput]::Ctrl(22,$false,$false); Start-Sleep -Milliseconds 800
$file=Find 'File'; if(-not $file){throw 'File missing after update'}
$r=$file.Current.BoundingRectangle
[MenuInput]::Click([int]($r.X+$r.Width/2),[int]($r.Y+$r.Height/2))
Start-Sleep -Milliseconds 400
"UIA after update"; Report 'New File' (Find 'New File'); Report 'New(old)' (Find 'New')
$toggle=(Find 'Sidebar').GetCurrentPattern([System.Windows.Automation.TogglePattern]::Pattern)
"UIA Sidebar checked=$($toggle.Current.ToggleState)"
[MenuInput]::Key(1,$false,$false); [MenuInput]::Key(1,$true,$false)
Start-Sleep -Milliseconds 200
[MenuInput]::Ctrl(49,$false,$false); Start-Sleep -Milliseconds 300
[MenuInput]::Ctrl(50,$false,$false); Start-Sleep -Milliseconds 300
[MenuInput]::Ctrl(18,$false,$false); Start-Sleep -Milliseconds 800
"UIA after dispose"; Report 'File' (Find 'File')
[MenuInput]::Ctrl(50,$false,$false); Start-Sleep -Milliseconds 2400
"LOG"; Get-Content $log
} finally {
Get-Process windows -ErrorAction SilentlyContinue | Where-Object {$_.Path -eq "$dir\runtime\windows.exe"} | Stop-Process
if($pkg) { Remove-AppxPackage $pkg.PackageFullName }
}
exit 0
