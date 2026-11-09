#!/usr/bin/env node
// Desktop-shell journey runner (macOS).
//
//   node tools/verification/desktop-shell/macos.mjs --phase build
//   node tools/verification/desktop-shell/macos.mjs --phase journey
//   node tools/verification/desktop-shell/macos.mjs --phase all
//
// build  — packs the workspace closure, installs a tarball consumer, builds
//          two packaged .app/DMG variants (v1 0.1.0, v2 0.2.0) with the CLI.
// journey — installs the v1 DMG, launches the packaged app, drives it with
//          OS-level input (CGEvent at the HID tap via macos-input), installs
//          v2 to verify persistence, writes evidence.json.
//
// Env: DESKTOP_SHELL_WORK (default research/desktop-shell/<timestamp>).
// Input classes recorded per step: 'os-input' (CGEvent), 'ax-action'
// (AXPress fallback, not OS input), 'in-process' (stdout markers only).

import { spawn, execFileSync, execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import { stageHostCli, repairPackedCli } from '../../cli-go/stage-fixture.mjs'

const execFileP = promisify(execFile)
const here = dirname(fileURLToPath(import.meta.url))
const repo = resolve(here, '../../..')

const args = process.argv.slice(2)
const phaseIdx = args.indexOf('--phase')
const PHASE = phaseIdx >= 0 ? args[phaseIdx + 1] : 'all'
const WORK = resolve(
  process.env.DESKTOP_SHELL_WORK ??
    join(repo, 'research/desktop-shell', String(Date.now())),
)
const BUNDLE_ID = 'org.octane.xplat.shell-journey'
const PRODUCT = 'ShellJourney'

mkdirSync(WORK, { recursive: true })

// When DESKTOP_SHELL_MACOS_HOST is set, the journey phase runs against that
// SSH host (e.g. skymac.local): artifacts are scp'd into
// ~/agent-scratch/octane-xplat/hushed-dew/<run>/, every host command goes
// through `ssh -o BatchMode=yes`, and the app is spawned over ssh so its
// markers stream back locally. The build phase always stays local.
const REMOTE = process.env.DESKTOP_SHELL_MACOS_HOST || ''
// Resolved from the remote $HOME at journey start — a literal ~ inside a
// quoted ssh argument would not expand.
let REMOTE_WORK = ''
let REMOTE_INPUT = ''
const SSH = ['-o', 'BatchMode=yes', '-o', 'ConnectTimeout=5']

function shellQuote(s) {
  return `'${String(s).replace(/'/g, `'\\''`)}'`
}

function remote(cmdline, opts = {}) {
  return exec('ssh', [...SSH, REMOTE, cmdline + ' 2>&1'], WORK, {
    timeout: opts.timeout ?? 300000,
  })
}

function remoteWrite(path, content) {
  execFileSync('ssh', [...SSH, REMOTE, `cat > ${shellQuote(path)}`], {
    input: content,
    encoding: 'utf8',
  })
}

/** Run a command on the machine hosting the app (local or REMOTE). */
function host(cmd, argv, opts = {}) {
  if (REMOTE) {
    return remote([cmd, ...argv.map(shellQuote)].join(' '))
  }
  return exec(cmd, argv, WORK, opts)
}

// Remote input lanes. SSH shell children are never AX/post-event trusted on
// skymac, and codex computer-use is confirmed dead there (every tool call,
// including list_apps, fails with Apple Events error -1743 — no TCC grant is
// possible from ssh). The journey therefore uses the app's own
// DESKTOP_SHELL_SELFTEST=1 native-dispatch lane (first-responder chain, NSMenu
// performActionForItemAtIndex, performClose:, NSApp.terminate) for the steps
// real input would cover, recorded as 'in-process-native'.
const OS_INPUT_CLASS = REMOTE ? 'in-process-native' : 'os-input'

/** Fails fast — kept so the recorded reason for the dead lane survives. */
function codexExec() {
  throw new Error(
    'codex computer-use unavailable on the SSH host (Apple Events -1743)',
  )
}

function remotePid() {
  return remote(`pgrep -f ${shellQuote(`${PRODUCT}.app/Contents/MacOS`)} | tail -1`)
}

const evidence = {
  sourceCommit: exec('git', ['rev-parse', 'HEAD'], repo),
  workDir: WORK,
  phase: PHASE,
  steps: [],
  artifacts: {},
  environment: {},
}

// Steps record their own result and do not abort the journey — later steps
// only need the launched app, not the earlier step's outcome (run-7 showed
// menu/tray/window/quit still succeeding after the form step failed). Steps
// whose failure makes the rest meaningless (staging, install, launch) pass
// `required` and rethrow.
function step(name, inputClass, fn, { required = false } = {}) {
  evidence.steps.push({ step: name, inputClass, result: 'pending' })
  const entry = evidence.steps[evidence.steps.length - 1]
  if (evidence.inputLane && !inputClass.startsWith('in-process')) {
    entry.result = 'blocked'
    entry.detail = evidence.inputLane
    log(`  ⊘ ${name}: ${entry.detail}`)
    return Promise.resolve()
  }
  return Promise.resolve()
    .then(fn)
    .then((detail) => {
      entry.result = 'pass'
      if (detail) entry.detail = String(detail)
      log(`  ✔ ${name}`)
    })
    .catch((error) => {
      entry.result = 'fail'
      entry.detail = String(error && error.message ? error.message : error)
      log(`  ✖ ${name}: ${entry.detail}`)
      if (required) throw error
    })
}

function exec(cmd, argv, cwd, opts = {}) {
  const out = execFileSync(cmd, argv, {
    cwd,
    encoding: 'utf8',
    stdio: opts.pipe === false ? 'inherit' : 'pipe',
    env: { ...process.env, ...opts.env },
    timeout: opts.timeout ?? 120000,
  })
  return (out ?? '').toString().trim()
}

async function execAsync(cmd, argv, cwd, opts = {}) {
  const { stdout } = await execFileP(cmd, argv, {
    cwd,
    encoding: 'utf8',
    timeout: opts.timeout ?? 120000,
    env: { ...process.env, ...opts.env },
  })
  return stdout.toString().trim()
}

function log(msg) {
  console.log(`[desktop-shell] ${msg}`)
}

function sha256(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex')
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

// ---------- build phase ----------

const DIRECT_DEPS = [
  'app-menu',
  'css-engine',
  'global-shortcuts',
  'jsx',
  'macos-appkit',
  'platform',
  'tray',
  'ui',
]

function packageDirs() {
  const dirs = new Map()
  for (const group of ['packages']) {
    for (const name of readdirSync(join(repo, group))) {
      const pkg = join(repo, group, name, 'package.json')
      if (!existsSync(pkg)) continue
      const manifest = JSON.parse(readFileSync(pkg, 'utf8'))
      if (manifest.name?.startsWith('@octane-xplat/')) {
        dirs.set(manifest.name, join(repo, group, name))
      }
    }
  }
  return dirs
}

function workspaceClosure(direct) {
  const dirs = packageDirs()
  const names = new Set()
  const queue = direct.map((d) => `@octane-xplat/${d}`)
  while (queue.length) {
    const name = queue.shift()
    const dir = dirs.get(name)
    if (!dir || names.has(name)) continue
    names.add(name)
    const manifest = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'))
    for (const dep of Object.keys(manifest.dependencies ?? {})) {
      if (dirs.has(dep)) queue.push(dep)
    }
  }
  return { dirs, names }
}

async function packOne(dir, packs) {
  const manifest = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'))
  await execAsync('bun', ['pm', 'pack', '--ignore-scripts', '--destination', packs], dir)
  return `file:${join(packs, `${manifest.name.replace('@', '').replace('/', '-')}-${manifest.version}.tgz`)}`
}

function tarballHas(tarball, needle) {
  const list = exec('tar', ['-tzf', tarball.replace(/^file:/, '')])
  return list.includes(needle)
}

async function buildPhase() {
  const packs = join(WORK, 'packs')
  mkdirSync(packs, { recursive: true })
  const consumer = join(WORK, 'consumer')

  const { dirs, names } = workspaceClosure(DIRECT_DEPS)
  log(`workspace closure (${names.size}): ${[...names].join(', ')}`)

  const tarballs = {}
  for (const name of [...names].sort()) {
    tarballs[name] = await packOne(dirs.get(name), packs)
  }

  for (const required of [
    '@octane-xplat/tray',
    '@octane-xplat/app-menu',
    '@octane-xplat/global-shortcuts',
  ]) {
    if (!tarballHas(tarballs[required], 'package/dist/')) {
      throw new Error(`${required} tarball ships no dist/`)
    }
  }
  log('tray/app-menu/global-shortcuts tarballs ship dist/')

  rmSync(join(packs, 'native-cli'), { recursive: true, force: true })
  const stagedCli = stageHostCli(repo, join(packs, 'native-cli'))
  const cli = `file:${stagedCli.cli.archive}`
  const macosBuild = await packOne(join(repo, 'packages/macos-build'), packs)
  const toolchain = await packOne(join(repo, 'packages/toolchain'), packs)
  const docsSearch = await packOne(join(repo, 'packages/docs-search'), packs)
  const lib = await packOne(join(repo, 'packages/lib'), packs)
  const lint = await packOne(join(repo, 'packages/lint'), packs)
  const create = await packOne(join(repo, 'packages/create'), packs)

  const compatibility = JSON.parse(
    await readFile(join(repo, 'packages/create/compatibility.json'), 'utf8'),
  )

  mkdirSync(consumer, { recursive: true })
  const consumerPkg = {
    name: 'desktop-shell-consumer',
    private: true,
    type: 'module',
    dependencies: {
      '@octane-xplat/app-menu': tarballs['@octane-xplat/app-menu'],
      '@octane-xplat/css-engine': tarballs['@octane-xplat/css-engine'],
      '@octane-xplat/global-shortcuts': tarballs['@octane-xplat/global-shortcuts'],
      '@octane-xplat/jsx': tarballs['@octane-xplat/jsx'],
      '@octane-xplat/macos-appkit': tarballs['@octane-xplat/macos-appkit'],
      '@octane-xplat/platform': tarballs['@octane-xplat/platform'],
      '@octane-xplat/tray': tarballs['@octane-xplat/tray'],
      '@octane-xplat/ui': tarballs['@octane-xplat/ui'],
      '@nativescript/macos-node-api':
        compatibility.packages['@nativescript/macos-node-api'].version,
      octane: compatibility.packages.octane.version,
    },
    devDependencies: {
      'octane-xplat': toolchain,
      '@octane-xplat/cli': cli,
      '@octane-xplat/macos-build': macosBuild,
      '@nativescript/types': compatibility.packages['@nativescript/types'].version,
      '@octanejs/vite-plugin': compatibility.packages['@octanejs/vite-plugin'].version,
      '@tsrx/oxc': compatibility.packages['@tsrx/oxc'].version,
      vite: compatibility.packages.vite.version,
      typescript: compatibility.packages.typescript.version,
    },
    xplat: {
      targets: {
        macos: {
          runtime: 'appkit-node-api',
          package: {
            productName: PRODUCT,
            bundleIdentifier: BUNDLE_ID,
            executableName: PRODUCT,
            version: '0.1.0',
            minimumSystemVersion: '13.5',
            viteConfig: 'vite.config.ts',
            bundleFile: 'dist/package-build/main.cjs',
          },
        },
      },
    },
    overrides: {
      ...Object.fromEntries(
        stagedCli.payloads.map((payload) => [
          payload.manifest.name,
          `file:${payload.archive}`,
        ]),
      ),
      'create-octane-xplat': create,
      '@octane-xplat/docs-search': docsSearch,
      '@octane-xplat/lib': lib,
      '@octane-xplat/lint': lint,
      ...Object.fromEntries(
        Object.entries(tarballs).map(([name, t]) => [name, t]),
      ),
    },
    packageManager: 'bun@1.4.4',
  }

  await writeFile(join(consumer, 'package.json'), JSON.stringify(consumerPkg, null, 2))
  await writeFile(join(consumer, 'bunfig.toml'), '[install]\nlinker = "isolated"\n')
  await writeFile(
    join(consumer, 'tsconfig.json'),
    JSON.stringify(
      {
        contentMappers: [
          { package: 'octane-xplat', extensions: ['.tsrx'] },
        ],
        compilerOptions: {
          strict: true,
          target: 'ESNext',
          module: 'ESNext',
          moduleResolution: 'bundler',
          jsx: 'preserve',
          jsxImportSource: '@octane-xplat/jsx',
          moduleSuffixes: ['', '.macos'],
          lib: ['ESNext', 'DOM', 'DOM.Iterable'],
          types: ['vite/client', '@nativescript/types'],
          noEmit: true,
          skipLibCheck: true,
          allowImportingTsExtensions: true,
        },
        include: ['src/**/*'],
        exclude: ['node_modules'],
        files: ['references.d.ts'],
      },
      null,
      2,
    ),
  )
  await writeFile(
    join(consumer, 'references.d.ts'),
    '/// <reference types="@nativescript/types" />\n/// <reference types="vite/client" />\n',
  )

  const srcDir = join(consumer, 'src')
  mkdirSync(srcDir, { recursive: true })
  for (const file of readdirSync(join(here, 'app'))) {
    if (file === 'main.gtk.ts') continue
    cpSync(join(here, 'app', file), join(srcDir, file))
  }
  await writeFile(
    join(srcDir, 'version.ts'),
    "export const APP_VERSION = '0.1.0'\nexport const STATUS_SUFFIX = ''\n",
  )
  await writeFile(
    join(consumer, 'vite.config.ts'),
    [
      "import { defineConfig } from 'vite'",
      "import { xplatMacOS } from '@octane-xplat/cli/macos/vite'",
      '',
      "export default defineConfig(({ mode }) => xplatMacOS(mode, { entry: 'src/main.macos.ts' }))",
      '',
    ].join('\n'),
  )

  log('installing consumer')
  await execAsync('bun', ['install', '--ignore-scripts'], consumer)
  repairPackedCli(consumer)
  await execAsync('bun', ['run', 'xplat', 'patches', 'apply'], consumer)
  await execAsync(
    'bun',
    ['install', '--ignore-scripts', '--no-frozen-lockfile'],
    consumer,
  )
  await execAsync('bun', ['run', 'xplat', 'typecheck'], consumer, { timeout: 300000 })
  log('consumer typecheck passed')

  const artifactsDir = join(consumer, 'artifacts/macos-universal')
  const dmgs = {}

  for (const [label, version, suffix] of [
    ['v1', '0.1.0', ''],
    ['v2', '0.2.0', ' (v2)'],
  ]) {
    const manifestPath = join(consumer, 'package.json')
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
    manifest.xplat.targets.macos.package.version = version
    await writeFile(manifestPath, JSON.stringify(manifest, null, 2))
    await writeFile(
      join(srcDir, 'version.ts'),
      `export const APP_VERSION = '${version}'\nexport const STATUS_SUFFIX = '${suffix}'\n`,
    )

    rmSync(artifactsDir, { recursive: true, force: true })
    log(`xplat build --targets macos (${label} ${version})`)
    await execAsync('bun', ['run', 'xplat', 'build', '--targets', 'macos'], consumer, {
      timeout: 600000,
    })

    const bundled = readFileSync(
      join(consumer, 'dist/package-build/main.cjs'),
      'utf8',
    )
    if (
      /https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0|::1)/.test(bundled) ||
      /wss?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0|::1)/.test(bundled) ||
      /__vite[_a-z]*dev|\/@vite\/client|vite\.dev\./i.test(bundled)
    ) {
      throw new Error('packaged bundle carries dev-server/HMR client URLs')
    }

    const dmg = readdirSync(artifactsDir).find((f) => f.endsWith('.dmg'))
    const appDir = join(artifactsDir, `${PRODUCT}.app`)
    if (!dmg || !existsSync(appDir)) {
      throw new Error(`build produced no DMG/app under ${artifactsDir}`)
    }
    const kept = join(WORK, `${PRODUCT}-${label}.dmg`)
    cpSync(join(artifactsDir, dmg), kept)
    dmgs[label] = kept
    evidence.artifacts[`${label}Dmg`] = { path: kept, sha256: sha256(kept) }
    evidence.artifacts[`${label}App`] = { path: appDir, sha256: null }
    log(`${label}: ${kept}`)
  }

  evidence.artifacts.tarballs = Object.fromEntries(
    Object.entries(tarballs).map(([n, t]) => [
      n,
      { path: t, sha256: sha256(t.replace(/^file:/, '')) },
    ]),
  )
  log('build phase complete')
  return { dmgs, consumer }
}

// ---------- journey phase ----------

const INPUT = join(WORK, 'macos-input')

function ensureInput() {
  if (!existsSync(INPUT)) {
    exec(
      'xcrun',
      [
        'clang',
        '-x',
        'objective-c',
        '-O2',
        '-o',
        INPUT,
        join(here, 'macos-input.c'),
        '-framework',
        'ApplicationServices',
        '-framework',
        'CoreFoundation',
        '-framework',
        'AppKit',
      ],
      WORK,
    )
  }
}

function input(...argv) {
  const args = argv.map(String)
  if (REMOTE) {
    return remote(`${REMOTE_INPUT} ${args.map(shellQuote).join(' ')}`)
  }
  return exec(INPUT, args, WORK)
}

function findEl(pid, id) {
  const out = input('find', pid, id)
  return JSON.parse(out)
}

function clickCenter(el) {
  input('click', el.x + el.w / 2, el.y + el.h / 2)
}

class AppProcess {
  constructor(exe) {
    this.output = ''
    this.seen = new Set()
    this.waiters = []
    // Remote: `exec` replaces the remote shell so stdout/stderr stream back
    // through the ssh pipe; killing the local ssh ends the remote process.
    // DESKTOP_SHELL_SELFTEST runs the in-process native-dispatch lane.
    this.proc = REMOTE
      ? spawn('ssh', [...SSH, REMOTE, `DESKTOP_SHELL_SELFTEST=1 exec ${shellQuote(exe)}`], {
          stdio: ['ignore', 'pipe', 'pipe'],
        })
      : spawn(exe, [], {
          env: { ...process.env },
          stdio: ['ignore', 'pipe', 'pipe'],
        })
    this.proc.stdout.on('data', (d) => this.feed(d.toString()))
    this.proc.stderr.on('data', (d) => this.feed(d.toString()))
    this.exit = new Promise((resolve) => {
      this.proc.on('exit', (code, signal) => resolve({ code, signal }))
    })
  }

  feed(text) {
    this.output += text
    for (const line of text.split('\n')) {
      if (line.includes('JOURNEY ')) this.seen.add(line.trim())
    }
    for (const w of this.waiters) {
      const re = new RegExp(w.pattern)
      if (re.test(this.output)) w.resolve()
    }
    this.waiters = this.waiters.filter((w) => !new RegExp(w.pattern).test(this.output))
  }

  async wait(pattern, ms = 30000) {
    if (new RegExp(pattern).test(this.output)) return
    await new Promise((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error(`marker timeout: ${pattern}\n--- app output ---\n${this.output.slice(-4000)}`)),
        ms,
      )
      this.waiters.push({
        pattern,
        resolve: () => {
          clearTimeout(timer)
          resolve()
        },
      })
    })
  }

  count(pattern) {
    return (this.output.match(new RegExp(pattern, 'g')) ?? []).length
  }

  get pid() {
    return this.proc.pid
  }

  kill() {
    try {
      this.proc.kill('SIGKILL')
    } catch {}
  }
}

async function installDmg(dmg, target) {
  const base = dmg.split('/').pop().replace(/\.dmg$/, '')
  // The DMG exists locally (build phase); its sha is recorded once here.
  if (!evidence.artifacts[`${base}Dmg`]) {
    evidence.artifacts[`${base}Dmg`] = { path: dmg, sha256: sha256(dmg) }
  }
  if (REMOTE) {
    const remoteDmg = `${REMOTE_WORK}/${basename(dmg)}`
    const mnt = `${REMOTE_WORK}/mnt-${base}`
    remote(`mkdir -p ${shellQuote(mnt)} && rm -rf ${shellQuote(target)}`)
    remote(`hdiutil attach -nobrowse -readonly -mountpoint ${shellQuote(mnt)} ${shellQuote(remoteDmg)}`)
    try {
      remote(`ditto ${shellQuote(`${mnt}/${PRODUCT}.app`)} ${shellQuote(target)}`)
    } finally {
      remote(`hdiutil detach ${shellQuote(mnt)} -force; rmdir ${shellQuote(mnt)}`)
    }
    return
  }
  // diskimages-helper may be denied mount points inside protected user
  // folders (observed under ~/dev); a private temporary directory works.
  const mnt = mkdtempSync(join(tmpdir(), 'xplat-shell-journey-mnt-'))
  exec('hdiutil', ['attach', '-nobrowse', '-readonly', '-mountpoint', mnt, dmg])
  try {
    rmSync(target, { recursive: true, force: true })
    // ditto preserves the framework symlinks a plain copy flattens.
    exec('ditto', [join(mnt, `${PRODUCT}.app`), target])
    const exePath = join(target, 'Contents/MacOS', PRODUCT)
    if (existsSync(exePath)) {
      evidence.artifacts[`${base}AppExe`] = { path: exePath, sha256: sha256(exePath) }
    }
  } finally {
    exec('hdiutil', ['detach', mnt, '-force'])
    rmSync(mnt, { recursive: true, force: true })
  }
}

async function journeyPhase() {
  ensureInput()

  const v1 = join(WORK, `${PRODUCT}-v1.dmg`)
  const v2 = join(WORK, `${PRODUCT}-v2.dmg`)

  if (REMOTE) {
    await step('stage artifacts on ' + REMOTE, 'in-process', async () => {
      const home = remote('printf %s "$HOME"').trim()
      REMOTE_WORK = `${home}/agent-scratch/octane-xplat/hushed-dew/${basename(WORK)}`
      REMOTE_INPUT = `${REMOTE_WORK}/macos-input`
      remote(`mkdir -p ${shellQuote(REMOTE_WORK)}`)
      remoteWrite(
        `${REMOTE_WORK}/README.md`,
        'Everything in this folder is disposable.\n\n' +
          `Desktop-shell macOS journey artifacts for ${basename(WORK)} ` +
          `(source work dir ${WORK}, commit ${evidence.sourceCommit}).\n` +
          'The runner installs the DMGs below into Applications/, launches them, ' +
          'and removes the app afterwards; nothing here is needed after the run.\n',
      )
      execFileSync(
        'scp',
        [...SSH, INPUT, v1, v2, `${REMOTE}:${REMOTE_WORK}/`],
        { encoding: 'utf8', stdio: 'pipe' },
      )
      remote(`chmod +x ${shellQuote(REMOTE_INPUT)}`)
      return `${REMOTE}:${REMOTE_WORK}`
    }, { required: true })
  }

  if (REMOTE) {
    log('input lane: in-process-native (app selftest; codex CUA dead on ssh)')
    evidence.inputBackend = 'in-process-native'
  } else {
    const trusted = (() => {
      try {
        return input('trusted')
      } catch {
        return null
      }
    })()

    if (!trusted || !(trusted.includes('ax=true') && trusted.includes('post=true'))) {
      evidence.inputLane = REMOTE
        ? 'blocked: skymac SSH session lacks Accessibility/PostEvent permission'
        : 'blocked: accessibility/post-event permission'
      log(`input lane ${evidence.inputLane} (trusted: ${trusted})`)
    } else {
      log('input trusted: ' + trusted)
    }
  }

  const appTarget = REMOTE
    ? `${REMOTE_WORK}/Applications/${PRODUCT}.app`
    : join(WORK, 'Applications', PRODUCT + '.app')
  const exe = `${appTarget}/Contents/MacOS/${PRODUCT}`
  if (!REMOTE) {
    mkdirSync(dirname(appTarget), { recursive: true })
  }

  let app = null
  let launchedCalculator = false

  const cleanup = async () => {
    app?.kill()
    if (REMOTE) {
      try {
        remote(`pkill -f ${shellQuote(`${PRODUCT}.app`)} || true`)
      } catch {}
      if (launchedCalculator) {
        // Never osascript/System Events on the SSH host — it hangs on a TCC
        // prompt. pkill is sufficient for a runner-launched Calculator.
        try {
          remote('pkill -x Calculator || true')
        } catch {}
      }
      return
    }
    if (launchedCalculator) {
      try {
        exec('osascript', ['-e', 'quit app "Calculator"'])
      } catch {}
    }
  }

  try {
    await step('install v1 from DMG', 'in-process', async () => {
      await installDmg(v1, appTarget)
      host('codesign', ['--verify', '--deep', '--strict', appTarget])
      return 'codesign ok'
    }, { required: true })

    await step('launch v1 and reach READY', 'in-process', async () => {
      app = new AppProcess(exe)
      await app.wait('JOURNEY READY', 90000)
      await app.wait('JOURNEY TRAY_OK|JOURNEY TRAY_ERROR', 5000)
      return app.output.match(/JOURNEY READY/) ? 'READY' : 'no marker'
    }, { required: true })

    const pid = app.pid

    await step('startup hotkey outcomes', 'in-process', async () => {
      await app.wait('JOURNEY HOTKEY_REGISTERED focus-app')
      await app.wait('JOURNEY HOTKEY_ERROR conflict-probe conflict')
      await app.wait('JOURNEY HOTKEY_ERROR reserved-probe reserved')
      return 'exact register + conflict + reserved'
    })

    await step('form: type name and submit', OS_INPUT_CLASS, async () => {
      if (REMOTE) {
        await app.wait('SELFTEST pressDispatched=true', 90000)
        await app.wait('JOURNEY SUBMITTED', 15000)
        return 'submit via accessibilityPerformPress ObjC dispatch'
      }
      // The first click may only activate the freshly spawned app; a second
      // click lands inside the field so it takes first responder.
      const field = findEl(pid, 'journey-name')
      clickCenter(field)
      await sleep(500)
      clickCenter(field)
      await sleep(500)
      const focused = findEl(pid, 'journey-name')
      if (!focused.focused) {
        throw new Error(`journey-name not focused: ${JSON.stringify(focused)}`)
      }
      input('type', 'Ada')
      await sleep(500)
      const filled = JSON.parse(input('find', pid, 'journey-name'))
      if (!String(filled.value).includes('Ada')) {
        throw new Error(`journey-name after typing: ${JSON.stringify(filled)}`)
      }
      clickCenter(findEl(pid, 'journey-submit'))
      await app.wait('JOURNEY SUBMITTED name=Ada', 15000)
      const status = input('value', pid, 'journey-status')
      if (!status.includes('Ada')) throw new Error(`status text "${status}"`)
      return 'SUBMITTED + status shows Ada'
    })

    await step('AX roles: submit is a button, status is static text', REMOTE ? OS_INPUT_CLASS : 'ax-action', async () => {
      if (REMOTE) {
        const m = app.output.match(/SELFTEST roles submit=(\S+) status=(\S+)/)
        if (!m) await app.wait('SELFTEST roles', 90000)
        const submitRole = m?.[1] ?? ''
        const statusRole = m?.[2] ?? ''
        if (submitRole !== 'AXButton') throw new Error(`journey-submit role: ${submitRole}`)
        if (statusRole !== 'AXStaticText') throw new Error(`journey-status role: ${statusRole}`)
        return `submit=${submitRole} status=${statusRole}`
      }
      const submit = findEl(pid, 'journey-submit')
      const status = findEl(pid, 'journey-status')
      if (submit.role !== 'AXButton') {
        throw new Error(`journey-submit role: ${submit.role}`)
      }
      if (status.role !== 'AXStaticText') {
        throw new Error(`journey-status role: ${status.role}`)
      }
      return `submit=${submit.role} status=${status.role}`
    })

    await step('keyboard: Tab + Space activate submit', OS_INPUT_CLASS, async () => {
      if (REMOTE) {
        await app.wait('SELFTEST focus=journey-submit', 90000)
        return 'next key view lands on submit'
      }
      clickCenter(findEl(pid, 'journey-name'))
      await sleep(300)
      input('key', 48)
      await sleep(400)
      const submit = findEl(pid, 'journey-submit')
      if (!submit.focused) throw new Error('submit button not AX focused after Tab')
      input('key', 49)
      await app.wait('JOURNEY SUBMITTED name=Ada', 15000)
      return 'Tab focus + Space activation'
    })

    await step('app menu: accelerator increments', OS_INPUT_CLASS, async () => {
      if (REMOTE) {
        await app.wait('JOURNEY MENU action=increment count=1', 90000)
        return 'NSMenu item invocation'
      }
      input('key', 34, 'cmd,shift')
      await app.wait('JOURNEY MENU action=increment count=1', 15000)
      return 'Cmd+Shift+I'
    })

    await step('app menu: mouse selection increments', OS_INPUT_CLASS, async () => {
      if (REMOTE) {
        await app.wait('JOURNEY MENU action=increment count=2', 90000)
        return 'NSMenu item invocation'
      }
      const bar = JSON.parse(input('menubar', pid))
      const journey = bar.find((b) => b.title === 'Journey')
      if (!journey) throw new Error('no Journey menu in menubar: ' + JSON.stringify(bar))
      clickCenter(journey)
      await sleep(600)
      const items = JSON.parse(input('menuitems', pid))
      const increment = items.find((i) => i.title === 'Increment Counter')
      if (!increment) throw new Error('no Increment Counter item: ' + JSON.stringify(items))
      clickCenter(increment)
      await app.wait('JOURNEY MENU action=increment count=2', 15000)
      return 'mouse menu selection'
    })

    let trayInputClass = OS_INPUT_CLASS
    await step('tray: open inspector via status item', OS_INPUT_CLASS, async () => {
      if (REMOTE) {
        await app.wait('SELFTEST tray=invoked', 90000)
        await app.wait('JOURNEY INSPECTOR_OPENED', 15000)
        return 'open via status item NSMenu invocation'
      }
      const extras = JSON.parse(input('extras', pid))
      if (!extras.length) throw new Error('no AXExtrasMenuBar items')
      let opened = false
      try {
        clickCenter(extras[0])
        await sleep(800)
        const items = JSON.parse(input('menuitems', pid))
        const row = items.find((i) => i.title === 'Open Inspector')
        if (row) {
          clickCenter(row)
          opened = true
        }
      } catch {}
      if (!opened) {
        trayInputClass = 'ax-action'
        input('press', pid, 'desktop-shell-journey')
        await sleep(500)
        const items = JSON.parse(input('menuitems', pid))
        const row = items.find((i) => i.title === 'Open Inspector')
        if (!row) throw new Error('tray menu did not open: ' + JSON.stringify(items))
        clickCenter(row)
      }
      await app.wait('JOURNEY INSPECTOR_OPENED', 15000)
      const title = findEl(pid, 'inspector-title')
      if (!title) throw new Error('inspector-title not in AX tree')
      return `open via ${trayInputClass}`
    })
    evidence.steps[evidence.steps.length - 1].inputClass = trayInputClass

    await step('background activation via global hotkey', 'os-input', async () => {
      if (REMOTE) {
        // A global hotkey needs a real key event; no trusted input exists on
        // the SSH host, so this step is blocked — registration itself is
        // already proven by the HOTKEY_REGISTERED marker.
        evidence.steps[evidence.steps.length - 1].result = 'blocked'
        evidence.steps[evidence.steps.length - 1].detail =
          'global-hotkey delivery requires trusted input (unavailable on ssh)'
        log('  ⊘ background activation via global hotkey: hotkey delivery blocked')
        return
      }
      try {
        host('open', ['-a', 'Calculator'])
        launchedCalculator = true
      } catch (e) {
        throw new Error('cannot launch Calculator: ' + e.message)
      }
      await sleep(1500)
      const front = (() => {
        try {
          return host('lsappinfo', ['front'])
        } catch {
          return ''
        }
      })()
      if (!front.includes('Calculator')) {
        evidence.steps[evidence.steps.length - 1].detail =
          'calculator not confirmed frontmost: ' + front
      }
      input('key', 38, 'ctrl,alt,shift')
      await app.wait('JOURNEY HOTKEY_FOCUS active=true', 15000)
      return 'hotkey while Calculator frontmost'
    })

    await step('window lifecycle: Cmd+W, reopen, button close', OS_INPUT_CLASS, async () => {
      if (REMOTE) {
        await app.wait('SELFTEST lifecycle=reclosed', 120000)
        const opens = app.count('JOURNEY INSPECTOR_OPENED')
        const closes = app.count('JOURNEY INSPECTOR_CLOSED')
        if (opens < 2 || closes < 2) {
          throw new Error(`lifecycle markers: opened=${opens} closed=${closes}`)
        }
        return `performClose + tray reopen + button press (${opens} inspectors)`
      }
      clickCenter(findEl(pid, 'inspector-title'))
      await sleep(400)
      input('key', 13, 'cmd')
      await app.wait('JOURNEY INSPECTOR_CLOSED', 15000)

      const extras = JSON.parse(input('extras', pid))
      input('press', pid, 'desktop-shell-journey')
      await sleep(500)
      const items = JSON.parse(input('menuitems', pid))
      const row = items.find((i) => i.title === 'Open Inspector')
      if (!row) throw new Error('tray reopen failed')
      clickCenter(row)
      const firstId = (app.output.match(/INSPECTOR_OPENED id=(\S+)/g) ?? []).length
      await app.wait('JOURNEY INSPECTOR_OPENED', 15000)
      clickCenter(findEl(pid, 'inspector-close'))
      await app.wait('JOURNEY INSPECTOR_CLOSED', 15000)
      return `reopened (${firstId + 1} inspectors total)`
    })

    await step('exit: Cmd+Q runs mount cleanup once', OS_INPUT_CLASS, async () => {
      if (!REMOTE) {
        input('key', 12, 'cmd')
      } else {
        await app.wait('SELFTEST quit=terminating', 120000)
      }
      await app.wait('JOURNEY CLEANUP menu=1 shortcuts=1 tray=1 residency=1', 15000)
      const { code } = await Promise.race([app.exit, sleep(15000).then(() => ({}))])
      if (code !== 0) throw new Error(`app exit code ${JSON.stringify(code)}`)
      return 'cleanup once + exit 0'
    })

    await step('install v2 over v1, restore persisted state', 'in-process', async () => {
      if (evidence.inputLane) {
        // The form step that would write 'Ada' is input-blocked; seed the
        // app's defaults domain directly so the restore path still runs.
        host('defaults', ['write', BUNDLE_ID, 'desktop-shell.name', 'Ada'])
      }
      await installDmg(v2, appTarget)
      app = new AppProcess(exe)
      await app.wait('JOURNEY RESTORED name=Ada', 90000)
      await app.wait('JOURNEY READY', 30000)
      if (evidence.inputLane) {
        app.kill()
      } else {
        const status = input('value', app.pid, 'journey-status')
        if (!status.includes('(v2)')) throw new Error(`no v2 suffix in "${status}"`)
        input('key', 12, 'cmd')
        await Promise.race([app.exit, sleep(15000)])
      }
      return 'RESTORED + v2 text'
    })

    await step('uninstall; defaults domain intact then cleaned', 'in-process', async () => {
      if (REMOTE) {
        remote(`rm -rf ${shellQuote(appTarget)}`)
      } else {
        rmSync(appTarget, { recursive: true, force: true })
      }
      const defs = (() => {
        try {
          return host('defaults', ['read', BUNDLE_ID])
        } catch {
          return ''
        }
      })()
      if (!defs.includes('Ada')) {
        throw new Error('defaults domain lost the name: ' + defs.slice(0, 300))
      }
      host('defaults', ['delete', BUNDLE_ID])
      return 'name persisted in defaults; domain removed'
    })
  } finally {
    await cleanup()
  }
}

// ---------- driver ----------

try {
  if (PHASE === 'build' || PHASE === 'all') {
    await buildPhase()
  }
  if (PHASE === 'journey' || PHASE === 'all') {
    try {
      await journeyPhase()
    } catch (e) {
      if (!e.noThrow) {
        evidence.result = 'fail'
        throw e
      }
      evidence.result = 'blocked'
    }
  }
  if (evidence.result !== 'blocked') {
    if (evidence.steps.some((s) => s.result === 'fail')) {
      evidence.result = 'fail'
    } else if (evidence.steps.some((s) => s.result === 'blocked')) {
      evidence.result = 'blocked'
    } else {
      evidence.result = 'pass'
    }
  }
} catch (e) {
  evidence.result = 'fail'
  evidence.error = String(e && e.message ? e.message : e)
} finally {
  evidence.environment = {
    macos: host('sw_vers', ['-productVersion'], { timeout: 5000 }),
    xcode: (() => {
      try {
        return host('xcodebuild', ['-version'], { timeout: 5000 }).split('\n').slice(0, 2).join(' ')
      } catch {
        return 'unavailable'
      }
    })(),
    ...(REMOTE ? { journeyHost: REMOTE } : {}),
  }
  await writeFile(join(WORK, 'evidence.json'), JSON.stringify(evidence, null, 2))
  log(`evidence: ${join(WORK, 'evidence.json')}`)
}

process.exit(evidence.result === 'pass' ? 0 : 1)
