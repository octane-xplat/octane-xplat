param([Parameter(Mandatory=$true)][string]$RunRoot)
$ErrorActionPreference='Stop'
$ProgressPreference='SilentlyContinue'
$run=[IO.Path]::GetFullPath($RunRoot)
Add-Type @'
using System;
using System.Runtime.InteropServices;
public static class LayoutActivation {
 public static uint Start(string id) {
  var manager=(ILayoutActivationManager)new LayoutActivationManager();
  uint pid;
  var result=manager.ActivateApplication(id,null,0,out pid);
  if(result<0) Marshal.ThrowExceptionForHR(result);
  return pid;
 }
}
[ComImport,Guid("45BA127D-10A8-46EA-8AB7-56EA9078943C")] public class LayoutActivationManager {}
[ComImport,Guid("2e941141-7f97-4756-ba1d-9decde894a3d"),InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
public interface ILayoutActivationManager {
 [PreserveSig] int ActivateApplication([MarshalAs(UnmanagedType.LPWStr)]string id,[MarshalAs(UnmanagedType.LPWStr)]string args,uint options,out uint pid);
}
'@
function ReadSharedLog($path) {
 if(!(Test-Path $path)){return ''}
 $stream=[IO.FileStream]::new($path,[IO.FileMode]::Open,[IO.FileAccess]::Read,([IO.FileShare]::ReadWrite -bor [IO.FileShare]::Delete))
 $reader=[IO.StreamReader]::new($stream)
 try {return $reader.ReadToEnd()} finally {$reader.Dispose();$stream.Dispose()}
}
$child=$null
$package=$null
$code=1
try {
 if(Test-Path "$run/gate.log"){throw 'Use a fresh run; previous evidence must be retained'}
 & "$run/windows-components-identity.ps1" -RunRoot $run
 $package=Get-Content "$run/identity.json" | ConvertFrom-Json
 $activationPid=[LayoutActivation]::Start("$($package.family)!App")
 $child=Get-Process -Id $activationPid -ErrorAction Stop
 "PID=$activationPid" | Set-Content "$run/activation.log"
 $deadline=(Get-Date).AddMinutes(3)
 do {
  Start-Sleep -Milliseconds 200
  $log=ReadSharedLog "$run/gate.log"
  $lines=@($log -split "`r?`n" | Where-Object {$_.StartsWith('[xplat-probe] ')})
  $results=@($lines | ForEach-Object {$_.Substring(14) | ConvertFrom-Json})
  if($results.Count -ge 4){break}
  if($child.HasExited){throw 'Owned WinUI process exited before four fixture results'}
 } while((Get-Date) -lt $deadline)
 if($results.Count -ne 4){throw 'No complete desktop fixture results before deadline'}
 if(@($results | Where-Object status -ne 'pass').Count){throw 'At least one Windows layout fixture failed'}
 $code=0
} catch {
 $_ | Out-String | Set-Content "$run/driver-error.log"
} finally {
 if($child -and !$child.HasExited){Stop-Process -Id $child.Id -ErrorAction SilentlyContinue; $child.WaitForExit(5000) | Out-Null}
 if($package){Remove-AppxPackage -Package $package.fullName}
 if(Test-Path "$run/gate.log"){Copy-Item "$run/gate.log" "$run/native-gate.log"}
 "$code" | Set-Content "$run/driver-status.log"
}
exit $code
