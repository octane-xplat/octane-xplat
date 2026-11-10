param(
 [Parameter(Mandatory=$true)][string]$RunRoot,
 [Parameter(Mandatory=$true)][string]$TaskName
)
$ErrorActionPreference='Stop'
$ProgressPreference='SilentlyContinue'
$run=[IO.Path]::GetFullPath($RunRoot)
$name=$TaskName
if(Get-ScheduledTask -TaskName $name -ErrorAction SilentlyContinue){throw 'Choose an unused task name'}
if([IO.Path]::GetFullPath($PSScriptRoot) -ne $run) {
 Copy-Item -LiteralPath "$PSScriptRoot/windows-run.ps1" -Destination "$run/windows-run.ps1" -Force
}
$action=New-ScheduledTaskAction -Execute 'powershell.exe' -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$run/windows-run.ps1`" -RunRoot `"$run`""
$principal=New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Limited
$settings=New-ScheduledTaskSettingsSet -ExecutionTimeLimit (New-TimeSpan -Minutes 2)
$settings.Priority=4
Register-ScheduledTask -TaskName $name -Action $action -Principal $principal -Settings $settings -Force | Out-Null
try {
 Start-ScheduledTask -TaskName $name
 Start-Sleep -Seconds 2
 for($i=0;$i -lt 50;$i++) {
  $task=Get-ScheduledTask -TaskName $name
  if($task.State -ne 'Running'){break}
  Start-Sleep -Seconds 1
 }
 $info=Get-ScheduledTaskInfo -TaskName $name
 "TASK=$($info.LastTaskResult)"
 if(Test-Path "$run/native-gate.log"){Get-Content "$run/native-gate.log"}
 if(Test-Path "$run/driver-error.log"){Get-Content "$run/driver-error.log"}
 if($info.LastTaskResult -ne 0){exit 1}
} finally { Unregister-ScheduledTask -TaskName $name -Confirm:$false }
