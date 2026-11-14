param(
 [Parameter(Mandatory=$true)][string]$RunRoot,
 [Parameter(Mandatory=$true)][string]$TaskName
)
$ErrorActionPreference='Stop'
$run=[IO.Path]::GetFullPath($RunRoot)
if(Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue){throw 'Choose an unused owned task name'}
$action=New-ScheduledTaskAction -Execute powershell.exe -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$run/windows-layout-run.ps1`" -RunRoot `"$run`""
$principal=New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Limited
$settings=New-ScheduledTaskSettingsSet -ExecutionTimeLimit (New-TimeSpan -Minutes 4)
$settings.Priority=4
Register-ScheduledTask -TaskName $TaskName -Action $action -Principal $principal -Settings $settings | Out-Null
try {
 Start-ScheduledTask -TaskName $TaskName
 $deadline=(Get-Date).AddMinutes(4)
 do {
  Start-Sleep -Seconds 1
  $task=Get-ScheduledTask -TaskName $TaskName
 } while($task.State -eq 'Running' -and (Get-Date) -lt $deadline)
 if($task.State -eq 'Running'){throw 'Owned desktop helper exceeded its deadline'}
 $info=Get-ScheduledTaskInfo -TaskName $TaskName
 "TASK=$($info.LastTaskResult)"
 foreach($name in @('native-gate.log','driver-error.log','activation.log')) {
  if(Test-Path "$run/$name"){Get-Content "$run/$name"}
 }
 if($info.LastTaskResult -ne 0){exit 1}
} finally {
 if((Get-ScheduledTask -TaskName $TaskName).State -eq 'Running'){Stop-ScheduledTask -TaskName $TaskName}
 Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
}
