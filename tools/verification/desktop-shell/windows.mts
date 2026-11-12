// Desktop-shell journey — Windows lane. Windows has no downstream app
// workflow yet, so this lane follows the packaged-runtime route of the
// package runtime tests: build phase (local) stages the shared journey app
// under apps/windows and bundles v1 (0.1.0) and v2 (0.2.0) with the harness
// Vite config; journey phase (windy) stages each bundle into a copy of the
// packaged NativeScript Windows runtime, registers it as an MSIX layout, and
// drives it from the interactive session with SendInput and UI Automation.
// The driver emits STEP|name|inputClass|result|detail lines.
import { execFileSync } from 'node:child_process'
import { createHash, randomUUID } from 'node:crypto'
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const repo = join(here, '../../..')
const harness = join(repo, 'apps/windows')
const WORK = process.env.DESKTOP_SHELL_WORK ?? join(repo, 'research/desktop-shell/windows-run-1')
const PHASE = process.argv.includes('--phase')
  ? process.argv[process.argv.indexOf('--phase') + 1]
  : 'all'

const HOST = process.env.DESKTOP_SHELL_WINDOWS_HOST ?? 'windy'
const RUNTIME =
  process.env.DESKTOP_SHELL_WINDOWS_RUNTIME ??
  'C:\\Users\\alecs\\dev\\octane-xplat\\apps\\windows\\platforms\\windows\\windows\\bin'

const TASK = 'hushed-dew'

const log = (m) => console.log(`[desktop-shell-windows] ${m}`)
const sha256 = (p) => createHash('sha256').update(readFileSync(p)).digest('hex')
const q = (v) => "'" + String(v).replaceAll("'", "''") + "'"
const ps = (script, timeout = 300_000) =>
  execFileSync(
    'ssh',
    [
      '-o',
      'BatchMode=yes',
      '-o',
      'ConnectTimeout=10',
      HOST,
      'powershell -NoProfile -EncodedCommand ' +
        Buffer.from(
          "$ErrorActionPreference='Stop'; $ProgressPreference='SilentlyContinue'; [Console]::OutputEncoding=[Text.Encoding]::UTF8; " +
            script,
          'utf16le',
        ).toString('base64'),
    ],
    { encoding: 'utf8', timeout, maxBuffer: 16 * 1024 * 1024 },
  )

function buildBundles() {
  const staged = join(harness, 'src/.desktop-shell-journey')
  const bundles = {}

  for (const [label, version, suffix] of [
    ['v1', '0.1.0', ''],
    ['v2', '0.2.0', ' (v2)'],
  ]) {
    rmSync(staged, { recursive: true, force: true })
    mkdirSync(staged, { recursive: true })
    for (const file of ['App.tsrx', 'Inspector.tsrx', 'journey.ts', 'main.windows.ts']) {
      cpSync(join(here, 'app', file), join(staged, file))
    }

    writeFileSync(
      join(staged, 'version.ts'),
      `export const APP_VERSION = '${version}'\nexport const STATUS_SUFFIX = '${suffix}'\n`,
    )

    const out = join(WORK, `bundle-${label}`)

    rmSync(out, { recursive: true, force: true })
    log(`bundling ${label}`)
    execFileSync('bunx', ['vite', 'build', '-c', 'vite.config.mts', '--outDir', out], {
      cwd: harness,
      stdio: 'inherit',
      env: {
        ...process.env,
        NATIVESCRIPT_BUNDLER_ENV: JSON.stringify({ windows: true }),
        XPLAT_WINDOWS_ENTRY: './src/.desktop-shell-journey/main.windows.ts',
      },
    })

    const zip = join(WORK, `app-${label}.zip`)

    rmSync(zip, { force: true })
    execFileSync('zip', ['-qr', zip, '.'], { cwd: out })
    bundles[label] = {
      version,
      zip,
      sha256: sha256(zip),
      bundleSha256: sha256(join(out, 'bundle.mjs')),
    }
  }

  rmSync(staged, { recursive: true, force: true })
  writeFileSync(join(WORK, 'bundles.json'), JSON.stringify(bundles, null, 2))
  return bundles
}

function runJourney() {
  const bundles = JSON.parse(readFileSync(join(WORK, 'bundles.json'), 'utf8'))
  const id = randomUUID().replaceAll('-', '').slice(0, 12)
  const identity = `org.xplat.desktopshell.${id}`
  const task = `XplatDesktopShell${id}`
  const remote = ps(
    `$d=Join-Path $env:USERPROFILE 'agent-scratch\\octane-xplat\\${TASK}\\windows-${id}'; New-Item -ItemType Directory -Force $d | Out-Null; Set-Content (Join-Path $d 'README.txt') 'Disposable desktop-shell journey scratch for task ${TASK}; safe to delete.'; $d`,
  ).trim()

  const upload = (local, name) =>
    execFileSync('scp', ['-q', local, `${HOST}:${remote.replaceAll('\\', '/')}/${name}`], {
      timeout: 300_000,
    })

  upload(bundles.v1.zip, 'app-v1.zip')
  upload(bundles.v2.zip, 'app-v2.zip')
  upload(join(here, 'windows/driver.ps1'), 'driver.ps1')

  const runLocal = join(WORK, 'run.ps1')

  writeFileSync(
    runLocal,
    `try { & ${q(remote + '\\driver.ps1')} -Directory ${q(remote)} -Runtime ${q(RUNTIME)} -Identity ${q(identity)} *> ${q(remote + '\\output.log')}; $code=0 } catch { $_ | Out-File -Append ${q(remote + '\\output.log')}; $code=1 } finally { Set-Content ${q(remote + '\\exit')} $code }\n`,
  )

  upload(runLocal, 'run.ps1')

  log(`journey on ${HOST} (${remote})`)

  const output = ps(
    `
try {
 $action=New-ScheduledTaskAction -Execute 'cmd.exe' -Argument ('/c "powershell.exe -NoProfile -ExecutionPolicy Bypass -File ""' + ${q(remote + '\\run.ps1')} + '"" < NUL"')
 $principal=New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Limited
 Register-ScheduledTask -TaskName ${q(task)} -Action $action -Principal $principal -Force | Out-Null
 Start-ScheduledTask -TaskName ${q(task)}
 $deadline=(Get-Date).AddSeconds(900)
 while(-not (Test-Path ${q(remote + '\\exit')})) { if((Get-Date) -gt $deadline){throw 'Interactive journey timed out'}; Start-Sleep -Milliseconds 500 }
 Get-Content ${q(remote + '\\output.log')}
} finally { Stop-ScheduledTask -TaskName ${q(task)} -ErrorAction SilentlyContinue; Unregister-ScheduledTask -TaskName ${q(task)} -Confirm:$false -ErrorAction SilentlyContinue }
`,
    1_000_000,
  )

  writeFileSync(join(WORK, 'journey-output.log'), output)

  const steps = output
    .split(/\r?\n/)
    .filter((line) => line.startsWith('STEP|'))
    .map((line) => {
      const [, step, inputClass, result, ...detail] = line.split('|')

      return { step, inputClass, result, detail: detail.join('|').trim() }
    })

  const windowsBuild = ps(
    `(Get-CimInstance Win32_OperatingSystem | ForEach-Object { $_.Caption + ' ' + $_.BuildNumber })`,
  ).trim()

  const harnessManifest = JSON.parse(readFileSync(join(harness, 'package.json'), 'utf8'))
  const evidence = {
    product: 'desktop-shell',
    platform: 'windows-winui',
    route:
      'packaged NativeScript Windows runtime (MSIX layout registration); no downstream consumer workflow exists',
    result: steps.length > 0 && steps.every((s) => s.result === 'pass') ? 'pass' : 'fail',
    sourceCommit: execFileSync('git', ['rev-parse', 'HEAD'], {
      cwd: repo,
      encoding: 'utf8',
    }).trim(),
    sourceDirty:
      execFileSync('git', ['status', '--porcelain'], { cwd: repo, encoding: 'utf8' }).trim() !== '',
    identity,
    host: HOST,
    remote,
    runtime: RUNTIME,
    environment: {
      windows: windowsBuild,
      nativescriptCore: harnessManifest.dependencies['@nativescript/core'],
      nativescriptWindows:
        harnessManifest.dependencies['@nativescript/windows'] ??
        harnessManifest.devDependencies?.['@nativescript/windows'],
    },
    artifacts: bundles,
    hashes: output.split(/\r?\n/).filter((line) => line.startsWith('HASH ')),
    steps,
  }

  writeFileSync(join(WORK, 'evidence.json'), JSON.stringify(evidence, null, 2))
  for (const s of steps) {
    log(
      `${s.result.padEnd(7)} ${s.inputClass.padEnd(30)} ${s.step}${s.detail ? ' — ' + s.detail : ''}`,
    )
  }

  return evidence
}

mkdirSync(WORK, { recursive: true })
if (PHASE === 'build' || PHASE === 'all') {
  buildBundles()
}

if (PHASE === 'journey' || PHASE === 'all') {
  if (!existsSync(join(WORK, 'bundles.json'))) {
    throw new Error(`no bundles in ${WORK}; run --phase build first`)
  }

  runJourney()
}
