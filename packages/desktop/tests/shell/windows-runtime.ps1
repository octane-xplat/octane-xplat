param([string]$Dotnet = "dotnet")
$ErrorActionPreference = 'Stop'
$scratch = Join-Path $env:USERPROFILE 'agent-scratch/octane-xplat/desktop-trash'
$Directory = Join-Path $scratch ([Guid]::NewGuid().ToString('N'))
New-Item -Force -ItemType Directory $Directory | Out-Null
$project = Join-Path $PSScriptRoot 'fixtures/WindowsTrashProbe.csproj'
$artifacts = Join-Path $Directory 'build'
& $Dotnet build $project --artifacts-path $artifacts -o $Directory
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
$code = 1
try {
  $fixture = Join-Path $Directory 'recoverable-trash.txt'
  Set-Content $fixture 'xplat-recycle-probe'
  function SendToTrash([string]$path, [string]$key) {
    $stdout = Join-Path $Directory "$key.stdout"
    $stderr = Join-Path $Directory "$key.stderr"
    $arguments = '"' + (Join-Path $Directory 'WindowsTrashProbe.dll') + '" "' + $path + '"'
    $child = Start-Process $Dotnet -ArgumentList $arguments -PassThru -RedirectStandardOutput $stdout -RedirectStandardError $stderr
    $null = $child.Handle
    try {
      if (!$child.WaitForExit(12000)) { throw "The $key operation did not finish" }
      if ($child.ExitCode -ne 0) { throw (Get-Content $stderr -Raw) }
      return (Get-Content $stdout -Raw).Trim()
    } finally {
      if (!$child.HasExited) { Stop-Process -Id $child.Id }
    }
  }
  $result = SendToTrash $fixture 'recycle'
  if ($result -ne 'recycled' -or (Test-Path -LiteralPath $fixture)) { throw "Shell did not recycle the source item. Result=$result" }
  $shell = New-Object -ComObject Shell.Application
  $recycle = $shell.NameSpace(10)
  $item = $null
  foreach ($candidate in $recycle.Items()) {
    if ($candidate.ExtendedProperty('System.Recycle.DeletedFrom') -eq $Directory) {
      if ($item) { throw 'More than one item found in the isolated fixture directory' }
      $item = $candidate
    }
  }
  if (!$item) { throw 'The synthetic file was not present in the Recycle Bin' }
  $recycledPath = $item.Path
  Write-Output 'PROBE RECYCLE_OK'
  $refused = SendToTrash $recycledPath 'refuse'
  if ($refused -ne 'failed' -or !(Test-Path -LiteralPath $recycledPath)) {
    throw "A second recycle attempt should leave the item in the bin. Result=$refused"
  }
  Write-Output 'PROBE REFUSAL_OK'
  $item.InvokeVerb('undelete')
  for ($attempt=0; $attempt -lt 30 -and !(Test-Path -LiteralPath $fixture); $attempt++) { Start-Sleep -Milliseconds 200 }
  if (!(Test-Path -LiteralPath $fixture) -or (Get-Content -LiteralPath $fixture) -ne 'xplat-recycle-probe') {
    throw 'Windows could not restore the synthetic file with its original contents'
  }
  Write-Output 'PROBE RESTORE_OK'
  $code = 0
} catch {
  Write-Warning $_
  Write-Warning "The synthetic fixture and probe output remain at $Directory"
}
exit $code
