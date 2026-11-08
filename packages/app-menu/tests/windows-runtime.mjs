// Packed official leaf + pinned NativeScript window resolver, AppX registration,
// UI Automation text/structure, pointer activation and SendInput keyboard checks.
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs'

import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'vite'

const host = process.env.APP_MENU_WINDOWS_HOST
const runtime = process.env.APP_MENU_WINDOWS_RUNTIME

assert.ok(host && runtime, 'Set APP_MENU_WINDOWS_HOST and APP_MENU_WINDOWS_RUNTIME')

const q = (value) => "'" + value.replaceAll("'", "''") + "'"
const run = (script, timeout = 250_000) =>
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
const identity = `org.xplat.appmenu.${id}`
const task = `OctaneAppMenu${id}`
const root = fileURLToPath(new URL('..', import.meta.url))
const temporary = mkdtempSync(join(tmpdir(), 'xplat-app-menu-windows-'))
let remote

try {
  execFileSync('bun', ['pm', 'pack', '--ignore-scripts', '--destination', temporary], {
    cwd: root,
    stdio: 'pipe',
  })

  execFileSync('tar', [
    '-xzf',
    join(
      temporary,
      readdirSync(temporary).find((name) => name.endsWith('.tgz')),
    ),
    '-C',
    temporary,
  ])

  const scope = join(temporary, 'node_modules/@octane-xplat')

  mkdirSync(scope, { recursive: true })
  symlinkSync(join(temporary, 'package'), join(scope, 'app-menu'))
  symlinkSync(join(root, '../lib'), join(scope, 'lib'))
  mkdirSync(join(temporary, 'node_modules/@nativescript'), { recursive: true })
  symlinkSync(
    join(root, 'node_modules/@nativescript/core'),
    join(temporary, 'node_modules/@nativescript/core'),
  )

  writeFileSync(
    join(temporary, 'fixture.js'),
    readFileSync(new URL('./fixtures/menu.windows.js', import.meta.url)),
  )

  await build({
    configFile: false,
    root: temporary,
    logLevel: 'warn',
    resolve: { conditions: ['windows'], dedupe: ['@nativescript/core'] },
    build: {
      outDir: temporary,
      emptyOutDir: false,
      minify: false,
      lib: { entry: join(temporary, 'fixture.js'), formats: ['es'], fileName: () => 'bundle.mjs' },
    },
  })

  remote = run(
    `$d=Join-Path $env:USERPROFILE 'agent-scratch/octane-xplat/app-menu-a3908a21/${id}'; New-Item -ItemType Directory -Force $d | Out-Null; $d`,
  ).trim()

  const write = (name, data) => {
    const local = join(temporary, 'upload-' + name)

    writeFileSync(local, data)
    execFileSync('scp', ['-q', local, host + ':' + remote.replaceAll('\\', '/') + '/' + name], {
      timeout: 60_000,
    })
  }

  write('bundle.mjs', readFileSync(join(temporary, 'bundle.mjs')))
  write('driver.ps1', readFileSync(new URL('./fixtures/menu-driver.windows.ps1', import.meta.url)))
  write(
    'run.ps1',
    Buffer.from(
      `try { & ${q(remote + '\\driver.ps1')} -Directory ${q(remote)} -Runtime ${q(runtime)} -Identity ${q(identity)} *> ${q(remote + '\\output.log')}; $code=0 } catch { $_ | Out-File -Append ${q(remote + '\\output.log')}; $code=1 } finally { Set-Content ${q(remote + '\\exit')} $code }`,
    ),
  )

  const output = run(`
try {
 $action=New-ScheduledTaskAction -Execute 'cmd.exe' -Argument ('/c "powershell.exe -NoProfile -ExecutionPolicy Bypass -File ""' + ${q(remote + '\\run.ps1')} + '"" < NUL"')
 $principal=New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Limited
 Register-ScheduledTask -TaskName ${q(task)} -Action $action -Principal $principal -Force | Out-Null
 $ownedTask=Get-ScheduledTask -TaskName ${q(task)}
 $ownedTask.Settings.Priority=4
 Set-ScheduledTask -TaskName ${q(task)} -Settings $ownedTask.Settings | Out-Null
 Start-ScheduledTask -TaskName ${q(task)}
 $deadline=(Get-Date).AddSeconds(220)
 while(-not (Test-Path ${q(remote + '\\exit')})) { if((Get-Date) -gt $deadline){throw 'Interactive fixture timed out'}; Start-Sleep -Milliseconds 400 }
 Get-Content ${q(remote + '\\output.log')}
 if((Get-Content ${q(remote + '\\exit')}) -ne '0') {throw 'Interactive driver failed'}
} finally { Stop-ScheduledTask -TaskName ${q(task)} -ErrorAction SilentlyContinue; Unregister-ScheduledTask -TaskName ${q(task)} -Confirm:$false -ErrorAction SilentlyContinue }
`)

  console.log(output)
  assert.match(output, /APPMENU AVAILABLE true/)
  assert.match(output, /UIA New-after-open .*enabled=True/)
  assert.match(output, /UIA Disabled .*enabled=False/)
  assert.match(output, /UIA New File .*enabled=True/)
  assert.match(output, /UIA New\(old\) missing/)
  assert.match(output, /UIA Sidebar checked=Off/)
  assert.match(output, /UIA after dispose\s+UIA File missing/)
  assert.match(output, /APPMENU WINDOWS_OK/)
  assert.doesNotMatch(output, /APPMENU (?:WINDOWS_FAIL|DISABLED_FAIL)/)
  console.log('APPMENU_WINDOWS_PACKED_RUNTIME_OK')
} catch (error) {
  if (remote) {
    console.error(
      run(
        `if(Test-Path ${q(remote + '\\output.log')}){Get-Content ${q(remote + '\\output.log')}}`,
        15_000,
      ),
    )
  }

  throw error
} finally {
  if (remote) {
    run(
      `Get-Process windows -ErrorAction SilentlyContinue | Where-Object {$_.Path -eq ${q(remote + '\\runtime\\windows.exe')}} | Stop-Process -Force; Get-AppxPackage -Name ${q(identity)} | Remove-AppxPackage; Remove-Item -Recurse -Force ${q(remote)}`,
      60_000,
    )
  }

  rmSync(temporary, { recursive: true, force: true })
}
