param([Parameter(Mandatory=$true)][string]$RunRoot)
$ErrorActionPreference='Stop'
$ProgressPreference='SilentlyContinue'
$run=[IO.Path]::GetFullPath($RunRoot)
Add-Type -AssemblyName UIAutomationClient
Add-Type -AssemblyName UIAutomationTypes
Add-Type @'
using System.Runtime.InteropServices;
public static class GestureGateInput {
 [DllImport("user32.dll")] public static extern bool SetProcessDpiAwarenessContext(System.IntPtr context);
 [DllImport("user32.dll", CharSet=CharSet.Unicode)] public static extern System.IntPtr FindWindow(string cls,string title);
 [DllImport("user32.dll")] public static extern bool SetForegroundWindow(System.IntPtr window);
 [DllImport("user32.dll")] public static extern System.IntPtr GetForegroundWindow();
 [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(System.IntPtr window,out uint processId);
 [DllImport("user32.dll")] public static extern void keybd_event(byte key,byte scan,uint flags,System.UIntPtr extra);
 [DllImport("user32.dll")] public static extern int GetSystemMetrics(int index);
 public static void MoveTo(int x,int y) {
  var left=GetSystemMetrics(76); var top=GetSystemMetrics(77);
  var width=GetSystemMetrics(78); var height=GetSystemMetrics(79);
  mouse_event(0xC001,(uint)((x-left)*65535L/(width-1)),(uint)((y-top)*65535L/(height-1)),0,System.UIntPtr.Zero);
 }
 [DllImport("user32.dll")] public static extern void mouse_event(uint flags,uint x,uint y,uint data,System.UIntPtr extra);
}
'@
[GestureGateInput]::SetProcessDpiAwarenessContext([IntPtr]::new(-4))|Out-Null
if(Test-Path "$run/bin/gate.log"){Move-Item "$run/bin/gate.log" "$run/previous-gate.log" -Force}
Copy-Item "$run/windows-bindings.js" "$run/bin/app/bundle.js" -Force
foreach($name in @('driver-error.log','driver-status.log','native-gate.log')) {
 if(Test-Path "$run/$name"){Move-Item "$run/$name" "$run/previous-$name" -Force}
}
$child=Start-Process "$run/bin/GestureBindings.exe" -WorkingDirectory "$run/bin" -PassThru
$null=$child.Handle
try {
 Start-Sleep -Seconds 4
 $condition=[Windows.Automation.PropertyCondition]::new([Windows.Automation.AutomationElement]::ProcessIdProperty,$child.Id)
 $window=[Windows.Automation.AutomationElement]::RootElement.FindFirst([Windows.Automation.TreeScope]::Children,$condition)
 if(!$window){throw 'Owned binding window unavailable'}
 $button=$window.FindFirst([Windows.Automation.TreeScope]::Descendants,[Windows.Automation.PropertyCondition]::new([Windows.Automation.AutomationElement]::NameProperty,'Handled native button'))
 if(!$button){throw 'Owned native button unavailable'}
 $handle=[IntPtr]::new($window.Current.NativeWindowHandle)
 $foreground=[GestureGateInput]::SetForegroundWindow($handle)
 "HANDLE=$handle FOREGROUND=$foreground" | Set-Content "$run/input-position.log"
 Start-Sleep -Milliseconds 500
 [uint32]$inputOwnerPid=0
 [GestureGateInput]::GetWindowThreadProcessId($handle,[ref]$inputOwnerPid)|Out-Null
 if($handle -eq [IntPtr]::Zero -or $inputOwnerPid -ne $child.Id -or [GestureGateInput]::GetForegroundWindow() -ne $handle){throw 'Owned native window must be foreground before input'}
 $rect=$button.Current.BoundingRectangle
 $rect | Out-String | Add-Content "$run/input-position.log"
 @{driverWidth=$rect.Width} | ConvertTo-Json -Compress | Add-Content "$run/bin/gate.log"
 if($rect.Width -lt 1 -or $rect.Height -lt 1){throw 'Native button has no input bounds'}
 [GestureGateInput]::MoveTo([int]($rect.X+$rect.Width/2),[int]($rect.Y+$rect.Height/2))|Out-Null
 [GestureGateInput]::mouse_event(2,0,0,0,[UIntPtr]::Zero)
 Start-Sleep -Milliseconds 100
 [GestureGateInput]::mouse_event(4,0,0,0,[UIntPtr]::Zero)
 Start-Sleep -Milliseconds 250
 [GestureGateInput]::mouse_event(2,0,0,0,[UIntPtr]::Zero)
 Start-Sleep -Milliseconds 100
 [GestureGateInput]::MoveTo([int]($rect.X+$rect.Width/2+100),[int]($rect.Y+$rect.Height/2))|Out-Null
 Start-Sleep -Milliseconds 100
 $invoke=$button.GetCurrentPattern([Windows.Automation.InvokePattern]::Pattern)
 $invoke.Invoke()
 Start-Sleep -Milliseconds 100
 [GestureGateInput]::mouse_event(4,0,0,0,[UIntPtr]::Zero)
 Start-Sleep -Milliseconds 250
 [GestureGateInput]::MoveTo([int]($rect.X+$rect.Width/2),[int]($rect.Y+$rect.Height/2))|Out-Null
 [GestureGateInput]::mouse_event(2,0,0,0,[UIntPtr]::Zero)
 Start-Sleep -Milliseconds 100
 [GestureGateInput]::mouse_event(4,0,0,0,[UIntPtr]::Zero)
 Start-Sleep -Milliseconds 250
 $button.SetFocus()
 Start-Sleep -Milliseconds 100
 [GestureGateInput]::keybd_event(0x20,0,0,[UIntPtr]::Zero)
 Start-Sleep -Milliseconds 100
 [GestureGateInput]::keybd_event(0x20,0,2,[UIntPtr]::Zero)
 Start-Sleep -Milliseconds 250
 [GestureGateInput]::mouse_event(2,0,0,0,[UIntPtr]::Zero)
 Start-Sleep -Milliseconds 750
 [GestureGateInput]::mouse_event(4,0,0,0,[UIntPtr]::Zero)
 Start-Sleep -Milliseconds 250
 [GestureGateInput]::mouse_event(2,0,0,0,[UIntPtr]::Zero)
 Start-Sleep -Milliseconds 75
 [GestureGateInput]::mouse_event(4,0,0,0,[UIntPtr]::Zero)
 Start-Sleep -Milliseconds 100
 [GestureGateInput]::mouse_event(2,0,0,0,[UIntPtr]::Zero)
 Start-Sleep -Milliseconds 75
 [GestureGateInput]::mouse_event(4,0,0,0,[UIntPtr]::Zero)
 Start-Sleep -Milliseconds 150
 $cleanup=$window.FindFirst([Windows.Automation.TreeScope]::Descendants,[Windows.Automation.PropertyCondition]::new([Windows.Automation.AutomationElement]::NameProperty,'Detach input owner'))
 if(!$cleanup){throw 'Owned cleanup button unavailable'}
 $cleanup.GetCurrentPattern([Windows.Automation.InvokePattern]::Pattern).Invoke()
 Start-Sleep -Milliseconds 150
 $button.GetCurrentPattern([Windows.Automation.InvokePattern]::Pattern).Invoke()
 @{postDisposeInvoked=$true} | ConvertTo-Json -Compress | Add-Content "$run/bin/gate.log"
 $child.WaitForExit()
 "EXIT=$($child.ExitCode)" | Set-Content "$run/driver-status.log"
 Get-Content "$run/bin/gate.log" | Set-Content "$run/native-gate.log"
} catch {
 $_ | Out-String | Set-Content "$run/driver-error.log"
 if(!$child.HasExited){$child.WaitForExit(28000)|Out-Null}
 if(!$child.HasExited){Stop-Process -Id $child.Id}
 throw
}
