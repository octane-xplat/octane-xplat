param([Parameter(Mandatory=$true)][string]$RunRoot)
$ErrorActionPreference='Stop'
$run=[IO.Path]::GetFullPath($RunRoot)
foreach($name in @('native-gate.log','driver-error.log','gate.log')) {
 if(Test-Path "$run/$name"){Move-Item "$run/$name" "$run/$($name.Replace('/','-')).previous" -Force}
}
trap { $_|Out-String|Set-Content "$run/driver-error.log"; exit 1 }
Add-Type -AssemblyName UIAutomationClient
Add-Type -AssemblyName UIAutomationTypes
Add-Type -AssemblyName System.Windows.Forms
Add-Type @'
using System;
using System.Runtime.InteropServices;
public static class PackedGestureInput {
 [StructLayout(LayoutKind.Sequential)] public struct Point { public int X,Y; }
 [DllImport("user32.dll")] public static extern bool SetProcessDpiAwarenessContext(IntPtr value);
 [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr window);
 [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
 [DllImport("user32.dll")] public static extern bool SetCursorPos(int x,int y);
 [DllImport("user32.dll")] public static extern int GetSystemMetrics(int index);
 public static void MoveTo(int x,int y) {
  var left=GetSystemMetrics(76); var top=GetSystemMetrics(77);
  var width=GetSystemMetrics(78); var height=GetSystemMetrics(79);
  mouse_event(0xC001,(uint)((x-left)*65535L/(width-1)),(uint)((y-top)*65535L/(height-1)),0,UIntPtr.Zero);
 }
 public static void Wheel(int delta) { mouse_event(0x0800,0,0,unchecked((uint)delta),UIntPtr.Zero); }
 [DllImport("user32.dll")] public static extern bool GetPhysicalCursorPos(out Point point);
 [DllImport("user32.dll")] public static extern IntPtr WindowFromPoint(Point point);
 [DllImport("user32.dll")] public static extern IntPtr GetAncestor(IntPtr window,uint flag);
 [DllImport("user32.dll")] public static extern void mouse_event(uint flags,uint x,uint y,uint data,UIntPtr extra);
 [DllImport("user32.dll")] public static extern void keybd_event(byte key,byte scan,uint flags,UIntPtr extra);
 public static uint Activate(string id) {
  var manager=(IApplicationActivationManager)new ApplicationActivationManager();
  uint pid;
  var result=manager.ActivateApplication(id,null,0,out pid);
  if(result<0) Marshal.ThrowExceptionForHR(result);
  return pid;
 }
}
[ComImport,Guid("45BA127D-10A8-46EA-8AB7-56EA9078943C")] public class ApplicationActivationManager {}
[ComImport,Guid("2e941141-7f97-4756-ba1d-9decde894a3d"),InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
public interface IApplicationActivationManager {
 [PreserveSig] int ActivateApplication([MarshalAs(UnmanagedType.LPWStr)]string id,[MarshalAs(UnmanagedType.LPWStr)]string args,uint options,out uint pid);
}
'@
[PackedGestureInput]::SetProcessDpiAwarenessContext([IntPtr]::new(-4))|Out-Null
$child=$null
$package=$null
function Records {
 if(Test-Path "$run/gate.log") { Get-Content "$run/gate.log" | Where-Object {$_.StartsWith('{')} | ForEach-Object {$_|ConvertFrom-Json} }
}
function Check($ok,$message) { if(!$ok){throw $message}; "CHECK $message" | Add-Content "$run/native-gate.log" }
function MovePointer($x,$y) { [PackedGestureInput]::MoveTo([int]$x,[int]$y) }
function Mouse($flags) { [PackedGestureInput]::mouse_event($flags,0,0,0,[UIntPtr]::Zero) }
function DragAt($x,$y,$distance,$release=$true) {
 MovePointer $x $y; Mouse 2
 for($step=1;$step -le 20;$step++){MovePointer ($x+$distance*$step/20) $y;Start-Sleep -Milliseconds 25}
 if($release){Mouse 4}
 Start-Sleep -Milliseconds 250
}
function CountKind($kind) { return @(Records|Where-Object kind -eq $kind).Count }
function FindControl($name,$type) {
 return $window.FindAll([Windows.Automation.TreeScope]::Descendants,[Windows.Automation.PropertyCondition]::new([Windows.Automation.AutomationElement]::NameProperty,$name)) | Where-Object {$_.Current.ControlType -eq $type} | Select-Object -First 1
}
try {
 & "$run/windows-components-identity.ps1" -RunRoot $run
 $package=Get-Content "$run/identity.json"|ConvertFrom-Json
 $activationPid=[PackedGestureInput]::Activate("$($package.family)!App")
 $child=Get-Process -Id $activationPid -ErrorAction SilentlyContinue
 Check ($null -ne $child) 'Owned package process starts'
 Check ($child.Path -eq "$run\bin\windows.exe") 'Activated process belongs to this run'
 Start-Sleep -Seconds 2
 Check (!$child.HasExited) "Native packed consumer remains alive (exit=$($child.ExitCode))"
 $condition=[Windows.Automation.PropertyCondition]::new([Windows.Automation.AutomationElement]::ProcessIdProperty,$child.Id)
 $window=[Windows.Automation.AutomationElement]::RootElement.FindFirst([Windows.Automation.TreeScope]::Children,$condition)
 for($attempt=0;$null -eq $window -and $attempt -lt 30;$attempt++) {
  Start-Sleep -Seconds 1
  $startup=Get-Content "$run/gate.log" -ErrorAction SilentlyContinue | Where-Object {($_.StartsWith('JSERROR=') -and $_ -ne 'JSERROR=') -or $_.StartsWith('LAUNCH_ERROR')}
  if($startup){throw ($startup -join [Environment]::NewLine)}
  $window=[Windows.Automation.AutomationElement]::RootElement.FindFirst([Windows.Automation.TreeScope]::Children,$condition)
 }
 Check ($null -ne $window) 'Owned public native window exists'
 $bridgeError=Records|Where-Object kind -eq 'native-owner-error'|Select-Object -First 1
 if($bridgeError){throw $bridgeError.detail}
 $window.FindAll([Windows.Automation.TreeScope]::Descendants,[Windows.Automation.Condition]::TrueCondition) | Select-Object -First 80 | ForEach-Object {
  @{name=$_.Current.Name;type=$_.Current.ControlType.ProgrammaticName;id=$_.Current.AutomationId} | ConvertTo-Json -Compress | Add-Content "$run/native-gate.log"
 }
 [PackedGestureInput]::SetForegroundWindow([IntPtr]::new($window.Current.NativeWindowHandle))|Out-Null
 Start-Sleep -Milliseconds 250
 Check ([PackedGestureInput]::GetForegroundWindow() -eq [IntPtr]::new($window.Current.NativeWindowHandle)) 'Owned window is foreground before OS input'
 $button=$window.FindAll([Windows.Automation.TreeScope]::Descendants,[Windows.Automation.PropertyCondition]::new([Windows.Automation.AutomationElement]::NameProperty,'Keep draft')) | Where-Object {$_.Current.ControlType -eq [Windows.Automation.ControlType]::Button} | Select-Object -First 1
 Check ($null -ne $button) 'Public Pressable exposes a UIA button'
 $r=$button.Current.BoundingRectangle
 @{kind='input-target';rect=@{x=$r.X;y=$r.Y;width=$r.Width;height=$r.Height};offscreen=$button.Current.IsOffscreen;enabled=$button.Current.IsEnabled} | ConvertTo-Json -Compress | Add-Content "$run/native-gate.log"
 Check ($r.Width -gt 0 -and $r.Height -gt 0 -and !$button.Current.IsOffscreen) 'Native button has a visible hit region'
 $x=$r.X+30; $y=$r.Y+30
 MovePointer $x $y
 $physical=[PackedGestureInput+Point]::new()
 [PackedGestureInput]::GetPhysicalCursorPos([ref]$physical)|Out-Null
 $hit=[PackedGestureInput]::WindowFromPoint($physical)
 @{kind='physical-input-target';x=$physical.X;y=$physical.Y;window=$hit.ToInt64()}|ConvertTo-Json -Compress|Add-Content "$run/native-gate.log"
 Check ([PackedGestureInput]::GetAncestor($hit,2) -eq [IntPtr]::new($window.Current.NativeWindowHandle)) 'OS pointer hits the owned native window before drag'
 Mouse 2
 for($i=1;$i -le 20;$i++){MovePointer ($x+5*$i) $y;Start-Sleep -Milliseconds 25}
 Mouse 4
 Start-Sleep -Milliseconds 350
 $records=@(Records)
 Check (@($records|Where-Object kind -eq 'press').Count -eq 0) 'Motion drag suppresses nested activation'
 Check (@($records|Where-Object kind -eq 'drag-finish').Count -eq 1) 'Motion drag finishes exactly once'
 $geometry=$records|Where-Object kind -eq 'geometry'|Select-Object -Last 1
 Check ($null -ne $geometry) 'Native public host geometry is observable'
 Check ([Math]::Abs($geometry.detail.x-100*180/$r.Width) -lt 2) 'Motion translation respects rendered parent and display scale'
 $r=$button.Current.BoundingRectangle
 MovePointer ($r.X+30) ($r.Y+30)
 Mouse 2; Start-Sleep -Milliseconds 70; Mouse 4
 Start-Sleep -Milliseconds 300
 Check (@(Records|Where-Object {$_.kind -eq 'press' -and $_.detail -eq 'pointer'}).Count -eq 1) 'Fresh pointer activation is independent'
 $button.SetFocus()
 [PackedGestureInput]::keybd_event(0x20,0,0,[UIntPtr]::Zero)
 Start-Sleep -Milliseconds 70
 [PackedGestureInput]::keybd_event(0x20,0,2,[UIntPtr]::Zero)
 Start-Sleep -Milliseconds 300
 Check (@(Records|Where-Object {$_.kind -eq 'press' -and $_.detail -eq 'keyboard'}).Count -eq 1) 'Space has keyboard provenance'
 $invoke=$button.GetCurrentPattern([Windows.Automation.InvokePattern]::Pattern)
 $invoke.Invoke()
 Start-Sleep -Milliseconds 300
 Check (@(Records|Where-Object {$_.kind -eq 'press' -and $_.detail -eq 'virtual'}).Count -eq 1) 'Independent UIA Invoke reaches shared press'
 $field=FindControl 'Draft title' ([Windows.Automation.ControlType]::Edit)
 Check ($null -ne $field) 'Public text field exposes native editing'
 $fieldRect=$field.Current.BoundingRectangle
 $reveals=CountKind 'reveal-start'
 DragAt ($fieldRect.X+30) ($fieldRect.Y+$fieldRect.Height/2) 70
 Check ((CountKind 'reveal-start') -eq $reveals) 'Native editing drag wins over ancestor reveal'
 $field.SetFocus()
 Start-Sleep -Milliseconds 100
 foreach($letter in 'PRESERVED'.ToCharArray()) {
  [PackedGestureInput]::keybd_event([byte][char]$letter,0,0,[UIntPtr]::Zero)
  Start-Sleep -Milliseconds 30
  [PackedGestureInput]::keybd_event([byte][char]$letter,0,2,[UIntPtr]::Zero)
 }
 Start-Sleep -Milliseconds 350
 Check (@(Records|Where-Object {$_.kind -eq 'edit' -and $_.detail.Contains('preserved')}).Count -gt 0) 'OS keys edit the native text field after selection drag'
 $slider=FindControl 'Draft position' ([Windows.Automation.ControlType]::Slider)
 Check ($null -ne $slider) 'Public slider exposes native RangeValue peer'
 $sliderRect=$slider.Current.BoundingRectangle
 DragAt ($sliderRect.X+$sliderRect.Width/2) ($sliderRect.Y+$sliderRect.Height/2) 70
 Check (@(Records|Where-Object {$_.kind -eq 'slider-change' -and $_.detail -ne 50}).Count -gt 0) 'OS drag updates public slider'
 Check ((CountKind 'reveal-start') -eq $reveals) 'Slider manipulation wins over ancestor reveal'
 $scroll=$window.FindFirst([Windows.Automation.TreeScope]::Descendants,[Windows.Automation.PropertyCondition]::new([Windows.Automation.AutomationElement]::IsScrollPatternAvailableProperty,$true))
 Check ($null -ne $scroll) 'Native viewport exposes observable scrolling'
 $scrollPattern=$scroll.GetCurrentPattern([Windows.Automation.ScrollPattern]::Pattern)
 Check ($scrollPattern.Current.VerticallyScrollable) 'Viewport content has a vertical scroll range'
 $scrollRect=$scroll.Current.BoundingRectangle
 $sx=$scrollRect.X+$scrollRect.Width/2; $sy=$scrollRect.Y+$scrollRect.Height-35
 $beforeScroll=$scrollPattern.Current.VerticalScrollPercent
 MovePointer $sx $sy
 [PackedGestureInput]::Wheel(-240)
 Start-Sleep -Milliseconds 350
 $scrolled=$scrollPattern.Current.VerticalScrollPercent
 Check ($scrolled -gt $beforeScroll) 'OS wheel scrolls the native viewport'
 DragAt $sx $sy 80
 Check ((CountKind 'reveal-start') -gt $reveals) 'Horizontal reveal activates over native scrolling content'
 Check ([Math]::Abs($scrollPattern.Current.VerticalScrollPercent-$scrolled) -lt 0.01) 'Horizontal claim retains native vertical offset'
 MovePointer $sx $sy
 [PackedGestureInput]::Wheel(120)
 Start-Sleep -Milliseconds 350
 Check ($scrollPattern.Current.VerticalScrollPercent -lt $scrolled) 'OS wheel resumes after horizontal reveal'
 $r=$button.Current.BoundingRectangle
 DragAt ($r.X+30) ($r.Y+30) 50 $false
 $invoke.Invoke()
 Start-Sleep -Milliseconds 200
 Check (@(Records|Where-Object {$_.kind -eq 'press' -and $_.detail -eq 'virtual'}).Count -eq 2) 'UIA Invoke remains independent during active pan'
 $other=[Windows.Forms.Form]::new()
 try {
  $other.Text='octane-owned-gesture-interruption';$other.Show()
  [PackedGestureInput]::SetForegroundWindow($other.Handle)|Out-Null
  [Windows.Forms.Application]::DoEvents()
  Start-Sleep -Milliseconds 200
  Check ([PackedGestureInput]::GetForegroundWindow() -eq $other.Handle) 'Owned interruption window actually takes focus'
  $terminals=@(Records|Where-Object kind -eq 'drag-finish')
  Check ($terminals.Count -eq 2 -and $terminals[-1].detail.cancelled) 'Native window interruption cancels Motion exactly once'
  Mouse 4
 } finally {$other.Close();$other.Dispose()}
 [PackedGestureInput]::SetForegroundWindow([IntPtr]::new($window.Current.NativeWindowHandle))|Out-Null
 $r=$button.Current.BoundingRectangle
 DragAt ($r.X+30) ($r.Y+30) 40 $false
 $retire=FindControl 'Retire scene' ([Windows.Automation.ControlType]::Button)
 Check ($null -ne $retire) 'Retirement control remains independent of drag capture'
 $retire.GetCurrentPattern([Windows.Automation.InvokePattern]::Pattern).Invoke()
 Start-Sleep -Milliseconds 200
 $retired=Records|Where-Object kind -eq 'retired'|Select-Object -Last 1
 Check ($null -ne $retired -and $null -eq $retired.detail.motion -and $null -eq $retired.detail.button -and $null -eq $retired.detail.scroll -and $null -eq $retired.detail.field) 'Active unmount clears native refs and handles'
 $quiet=@(Records).Count
 Mouse 4
 Start-Sleep -Milliseconds 350
 Check (@(Records).Count -eq $quiet) 'Retired callbacks stay silent through OS pointer release'
 $errors=Get-Content "$run/gate.log"|Where-Object {$_.StartsWith('NATIVE_ERROR') -or ($_.StartsWith('JSERROR=') -and $_ -ne 'JSERROR=') -or $_.StartsWith('LAUNCH_ERROR')}
 Check (!$errors) 'Native and JavaScript hosts report no runtime error'
 'PACKED_WINDOWS_COMPONENTS_OK'|Add-Content "$run/native-gate.log"
} catch { $_|Out-String|Set-Content "$run/driver-error.log"; exit 1 }
finally {
 try {Mouse 4} catch {}
 if($null -ne $child -and !$child.HasExited){Stop-Process -Id $child.Id}
 if($package){Remove-AppxPackage -Package $package.fullName}
 if(Test-Path "$run/gate.log"){Get-Content "$run/gate.log"|Add-Content "$run/native-gate.log"}
}
