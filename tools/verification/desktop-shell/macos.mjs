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
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
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

const evidence = {
  sourceCommit: exec('git', ['rev-parse', 'HEAD'], repo),
  workDir: WORK,
  phase: PHASE,
  steps: [],
  artifacts: {},
  environment: {},
}

function step(name, inputClass, fn) {
  evidence.steps.push({ step: name, inputClass, result: 'pending' })
  const entry = evidence.steps[evidence.steps.length - 1]
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
      throw error
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
  return exec(INPUT, argv.map(String), WORK)
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
    this.proc = spawn(exe, [], {
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
  const mnt = join(WORK, 'mnt')
  mkdirSync(mnt, { recursive: true })
  exec('hdiutil', ['attach', '-nobrowse', '-readonly', '-mountpoint', mnt, dmg])
  try {
    rmSync(target, { recursive: true, force: true })
    // ditto preserves the framework symlinks a plain copy flattens.
    exec('ditto', [join(mnt, `${PRODUCT}.app`), target])
  } finally {
    exec('hdiutil', ['detach', mnt, '-force'])
  }
}

async function journeyPhase() {
  ensureInput()

  const trusted = (() => {
    try {
      return input('trusted')
    } catch {
      return null
    }
  })()

  if (!trusted) {
    evidence.inputLane = 'blocked: accessibility/post-event permission'
    log('input lane blocked: macos-input lacks accessibility/post-event trust')
    const err = new Error(evidence.inputLane)
    err.noThrow = true
    throw err
  }
  log('input trusted: ' + trusted)

  const v1 = join(WORK, `${PRODUCT}-v1.dmg`)
  const v2 = join(WORK, `${PRODUCT}-v2.dmg`)
  const appTarget = join(WORK, 'Applications', PRODUCT + '.app')
  mkdirSync(dirname(appTarget), { recursive: true })
  const exe = join(appTarget, 'Contents/MacOS', PRODUCT)

  let app = null
  let launchedCalculator = false

  const cleanup = async () => {
    app?.kill()
    if (launchedCalculator) {
      try {
        exec('osascript', ['-e', 'quit app "Calculator"'])
      } catch {}
    }
  }

  try {
    await step('install v1 from DMG', 'in-process', async () => {
      await installDmg(v1, appTarget)
      exec('codesign', ['--verify', '--deep', '--strict', appTarget])
      return 'codesign ok'
    })

    await step('launch v1 and reach READY', 'in-process', async () => {
      app = new AppProcess(exe)
      await app.wait('JOURNEY READY', 90000)
      await app.wait('JOURNEY TRAY_OK|JOURNEY TRAY_ERROR', 5000)
      return app.output.match(/JOURNEY READY/) ? 'READY' : 'no marker'
    })

    const pid = app.pid

    await step('startup hotkey outcomes', 'in-process', async () => {
      await app.wait('JOURNEY HOTKEY_REGISTERED focus-app')
      await app.wait('JOURNEY HOTKEY_ERROR conflict-probe conflict')
      await app.wait('JOURNEY HOTKEY_ERROR reserved-probe reserved')
      return 'exact register + conflict + reserved'
    })

    await step('form: type name and submit', 'os-input', async () => {
      clickCenter(findEl(pid, 'journey-name'))
      await sleep(400)
      input('type', 'Ada')
      await sleep(400)
      clickCenter(findEl(pid, 'journey-submit'))
      await app.wait('JOURNEY SUBMITTED name=Ada', 15000)
      const status = input('value', pid, 'journey-status')
      if (!status.includes('Ada')) throw new Error(`status text "${status}"`)
      return 'SUBMITTED + status shows Ada'
    })

    await step('keyboard: Tab + Space activate submit', 'os-input', async () => {
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

    await step('app menu: accelerator increments', 'os-input', async () => {
      input('key', 34, 'cmd,shift')
      await app.wait('JOURNEY MENU action=increment count=1', 15000)
      return 'Cmd+Shift+I'
    })

    await step('app menu: mouse selection increments', 'os-input', async () => {
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

    let trayInputClass = 'os-input'
    await step('tray: open inspector via status item', 'os-input', async () => {
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
      try {
        exec('open', ['-a', 'Calculator'])
        launchedCalculator = true
      } catch (e) {
        throw new Error('cannot launch Calculator: ' + e.message)
      }
      await sleep(1500)
      const front = (() => {
        try {
          return exec('lsappinfo', ['front'])
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

    await step('window lifecycle: Cmd+W, reopen, button close', 'os-input', async () => {
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

    await step('exit: Cmd+Q runs mount cleanup once', 'os-input', async () => {
      input('key', 12, 'cmd')
      await app.wait('JOURNEY CLEANUP menu=1 shortcuts=1 tray=1 residency=1', 15000)
      const { code } = await Promise.race([app.exit, sleep(15000).then(() => ({}))])
      if (code !== 0) throw new Error(`app exit code ${JSON.stringify(code)}`)
      return 'cleanup once + exit 0'
    })

    await step('install v2 over v1, restore persisted state', 'in-process', async () => {
      await installDmg(v2, appTarget)
      app = new AppProcess(exe)
      await app.wait('JOURNEY RESTORED name=Ada', 90000)
      await app.wait('JOURNEY READY', 30000)
      const status = input('value', app.pid, 'journey-status')
      if (!status.includes('(v2)')) throw new Error(`no v2 suffix in "${status}"`)
      input('key', 12, 'cmd')
      await Promise.race([app.exit, sleep(15000)])
      return 'RESTORED + v2 text'
    })

    await step('uninstall; defaults domain intact then cleaned', 'in-process', async () => {
      rmSync(appTarget, { recursive: true, force: true })
      const defs = (() => {
        try {
          return exec('defaults', ['read', BUNDLE_ID])
        } catch {
          return ''
        }
      })()
      if (!defs.includes('Ada')) {
        throw new Error('defaults domain lost the name: ' + defs.slice(0, 300))
      }
      exec('defaults', ['delete', BUNDLE_ID])
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
    evidence.result = evidence.steps.every((s) => s.result === 'pass') ? 'pass' : 'fail'
  }
} catch (e) {
  evidence.result = 'fail'
  evidence.error = String(e && e.message ? e.message : e)
} finally {
  evidence.environment = {
    macos: exec('sw_vers', ['-productVersion'], WORK, { timeout: 5000 }),
    xcode: (() => {
      try {
        return exec('xcrun', ['clang', '--version'], WORK, { timeout: 5000 }).split('\n')[0]
      } catch {
        return 'unavailable'
      }
    })(),
  }
  await writeFile(join(WORK, 'evidence.json'), JSON.stringify(evidence, null, 2))
  log(`evidence: ${join(WORK, 'evidence.json')}`)
}

process.exit(evidence.result === 'pass' ? 0 : 1)
