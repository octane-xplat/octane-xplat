// Feasibility probe: is Windows.Media.SpeechRecognition.SpeechRecognizer usable
// from the NativeScript Windows preview runtime?
// Probe-only file — not wired into package.json scripts. Run manually:
//   node tests/windows-probe.mjs
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'vite'

const host = process.env.SPEECH_WINDOWS_HOST ?? 'windy'
const runtime =
  process.env.SPEECH_WINDOWS_RUNTIME ??
  'C:\\Users\\alecs\\dev\\octane-xplat\\apps\\windows\\platforms\\windows\\windows\\bin'

const quote = (value) => "'" + value.replaceAll("'", "''") + "'"
const run = (script, timeout = 90_000) =>
  execFileSync(
    'ssh',
    [
      '-o',
      'BatchMode=yes',
      '-o',
      'ConnectTimeout=5',
      host,
      'powershell -NoProfile -EncodedCommand ' +
        Buffer.from(
          "$ErrorActionPreference='Stop'; $ProgressPreference='SilentlyContinue'; [Console]::OutputEncoding=[Text.Encoding]::UTF8; " +
            script,
          'utf16le',
        ).toString('base64'),
    ],
    { encoding: 'utf8', timeout, maxBuffer: 4 * 1024 * 1024 },
  )

const id = randomUUID().replaceAll('-', '')
const identity = `org.xplat.speech.${id}`
const directory = mkdtempSync(join(tmpdir(), 'xplat-speech-windows-'))
let remote
try {
  assert.ok(run(`Test-Path ${quote(runtime)}`).trim() === 'True', `runtime missing: ${runtime}`)

  await build({
    configFile: false,
    logLevel: 'warn',
    build: {
      outDir: directory,
      emptyOutDir: false,
      minify: false,
      lib: {
        entry: fileURLToPath(new URL('./fixtures/speech-probe.windows.js', import.meta.url)),
        formats: ['es'],
        fileName: () => 'bundle.mjs',
      },
    },
  })

  remote = run(
    `$d=Join-Path $env:TEMP 'xplat-speech-${id}'; New-Item -ItemType Directory $d | Out-Null; $d`,
  ).trim()

  assert.ok(remote.endsWith(`\\xplat-speech-${id}`), remote)

  const write = (name, contents) =>
    run(
      `[IO.File]::WriteAllBytes(${quote(remote + '\\' + name)}, [Convert]::FromBase64String('${Buffer.from(contents).toString('base64')}'))`,
    )

  execFileSync(
    'scp',
    ['-q', join(directory, 'bundle.mjs'), `${host}:./xplat-speech-${id}-bundle.mjs`],
    {
      timeout: 30_000,
    },
  )

  run(
    `Move-Item (Join-Path $env:USERPROFILE 'xplat-speech-${id}-bundle.mjs') ${quote(remote + '\\bundle.mjs')}`,
  )

  write(
    'driver.ps1',
    readFileSync(new URL('./fixtures/speech-driver.windows.ps1', import.meta.url)),
  )

  const runner = `try { & ${quote(remote + '\\driver.ps1')} -Directory ${quote(remote)} -Runtime ${quote(runtime)} -Identity ${quote(identity)} *> ${quote(remote + '\\output.log')}; $code=0 } catch { $_ | Out-File -Append ${quote(remote + '\\output.log')}; $code=1 } finally { Set-Content ${quote(remote + '\\exit')} $code }`
  write('run.ps1', runner)

  const output = run(
    `
$name='OctaneSpeech${id}'
try {
 schtasks /create /tn $name /tr ('powershell.exe -NoProfile -ExecutionPolicy Bypass -File "' + ${quote(remote + '\\run.ps1')} + '"') /sc once /st 00:00 /it /f | Out-Null
 schtasks /run /tn $name | Out-Null
 $deadline=(Get-Date).AddSeconds(120)
 while (-not (Test-Path ${quote(remote + '\\exit')})) { if((Get-Date) -gt $deadline){throw 'Interactive fixture timed out'}; Start-Sleep -Milliseconds 300 }
 Get-Content ${quote(remote + '\\output.log')}
} finally { $ErrorActionPreference='Continue'; schtasks /end /tn $name 2>$null | Out-Null; schtasks /delete /tn $name /f | Out-Null }
`,
    180_000,
  )

  console.log(output)
} finally {
  if (remote) {
    run(
      `Get-Process windows -ErrorAction SilentlyContinue | Where-Object {$_.Path -eq ${quote(remote + '\\runtime\\windows.exe')}} | Stop-Process; Get-AppxPackage -Name ${quote(identity)} | Remove-AppxPackage; Remove-Item -Recurse -Force ${quote(remote)}`,
    )
  }

  rmSync(directory, { recursive: true, force: true })
}
