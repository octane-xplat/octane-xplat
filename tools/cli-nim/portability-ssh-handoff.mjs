// Run this Turbo gate on the controlling host, under the remote host lease.
// Windows Turbo's task teardown ends detached descendants; Bun's script runner
// permits the owner to survive. Preserve that observed distinction in evidence.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'

assert.notEqual(process.platform, 'win32', 'Use a separate controlling host to verify SSH disconnect')
const configuration = process.env.XPLAT_NIM_HANDOFF_CONFIG
assert.ok(configuration, 'Set XPLAT_NIM_HANDOFF_CONFIG to the task-local remote configuration JSON')
const config = JSON.parse(readFileSync(configuration, 'utf8'))
assert.match(config.host, /^[a-zA-Z0-9_.@-]+$/)
assert.ok(!config.host.startsWith('-'))
assert.match(config.manifestSha256, /^[a-f0-9]{64}$/)
for (const name of ['source', 'cache', 'bun', 'temporary']) {
 assert.match(config[name], /^[A-Za-z]:\\/)
 assert.ok(config[name].includes('\\agent-scratch\\octane-xplat\\') && !config[name].includes('\0'), `Use task-local ${name}`)
}
const quote = value => "'"+value.replaceAll("'", "''")+"'"
for (const phase of ['start', 'verify']) {
 const code = `$ErrorActionPreference='Stop'; $ProgressPreference='SilentlyContinue'
$sourceRoot=${quote(config.source)}
$manifest=Join-Path $sourceRoot 'portability-source.json'
if ((Get-FileHash -Algorithm SHA256 $manifest).Hash.ToLowerInvariant() -ne ${quote(config.manifestSha256)}) {throw 'Wrong native source snapshot'}
$env:XPLAT_NIM_PORTABILITY_CACHE=${quote(config.cache)}
$env:TEMP=${quote(config.temporary)}; $env:TMP=$env:TEMP
$env:NODE_OPTIONS=''; $env:NODE_PATH=''
${phase === 'start' ? `# Native PowerShell ancestry retains hidden drive environment entries.
$project=Join-Path $env:TEMP ('powershell-owner-'+[Guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $project | Out-Null
[IO.File]::WriteAllText((Join-Path $project 'package.json'),'{"private":true,"xplat":{"targets":{"web":{}}}}')
$probe=Join-Path $env:XPLAT_NIM_PORTABILITY_CACHE 'bin/host-probe.exe'
$main=Join-Path $env:XPLAT_NIM_PORTABILITY_CACHE 'bin/xplat.exe'
$env:XPLAT_AGENT_HOST_IDLE_MS='6000'
$ready=$null
try {
 $request=@{operation='ensure';root=$project;executable=$main} | ConvertTo-Json -Compress
 $ready=($request | & $probe) | ConvertFrom-Json
 if (-not $ready.ok) {throw ('PowerShell native bootstrap failed: '+$ready.message)}
} finally {
 if ($ready.ok) {
  $request=@{operation='call';root=$project;method='host.shutdown'} | ConvertTo-Json -Compress
  $stopped=($request | & $probe) | ConvertFrom-Json
  if (-not $stopped.ok) {throw 'PowerShell native shutdown failed'}
  $deadline=(Get-Date).AddSeconds(6)
  while ((Get-Process -Id $ready.pid -ErrorAction SilentlyContinue) -and (Get-Date) -lt $deadline) {Start-Sleep -Milliseconds 10}
  if (Get-Process -Id $ready.pid -ErrorAction SilentlyContinue) {throw 'PowerShell owner is still live'}
  $paths=(@{operation='paths';root=$project} | ConvertTo-Json -Compress | & $probe) | ConvertFrom-Json
  Remove-Item -LiteralPath $paths.directory -Recurse
 }
 Remove-Item -LiteralPath $project -Recurse
}
Write-Output 'Native PowerShell bootstrap/RPC/shutdown passed with inherited OS environment.'
` : ''}
Push-Location (Join-Path $sourceRoot 'tools/cli-nim')
try {
 & ${quote(config.bun)} run test:portability-handoff-${phase}
 if ($LASTEXITCODE -ne 0) {throw 'Separate SSH owner handoff failed'}
} finally {Pop-Location}
`
 const encoded = Buffer.from(code, 'utf16le').toString('base64')
 const result = spawnSync('ssh', ['-o','BatchMode=yes','-o','ConnectTimeout=8',config.host,
  'powershell -NoProfile -NonInteractive -EncodedCommand '+encoded], { stdio: 'inherit', timeout: 45000 })
 assert.equal(result.status, 0, result.error?.message ?? `Remote ${phase} failed (${result.signal ?? result.status})`)
 console.log(`SSH connection closed after ${phase}`)
}
