// Desktop-shell journey — Linux GTK lane. Build phase (local): packs the
// workspace closure, installs a tarball consumer, builds two GTK app
// archives (v1 0.1.0, v2 0.2.0). Journey phase (andromeda.local): stages the
// archives and container assets, builds a Docker image (Xvfb + KDE portal +
// pyatspi + StatusNotifierWatcher) and runs the journey inside it, parsing
// STEP|name|inputClass|result|detail lines into evidence.json.
import { execFileSync, execFile } from 'node:child_process'
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
import { promisify } from 'node:util'
import { createHash } from 'node:crypto'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { stageHostCli, repairPackedCli } from '../../cli-go/stage-fixture.mjs'

const execAsync = promisify(execFile)
const here = dirname(fileURLToPath(import.meta.url))
const repo = join(here, '../../..')
const WORK = process.env.DESKTOP_SHELL_WORK ?? join(repo, 'research/desktop-shell/linux-run-1')
const PHASE = process.argv.includes('--phase')
  ? process.argv[process.argv.indexOf('--phase') + 1]
  : 'all'
const REMOTE = process.env.DESKTOP_SHELL_LINUX_HOST ?? 'andromeda.local'
const APP_ID = 'org.octane.xplat.shell-journey'
const APP_NAME = 'desktop-shell-journey'
const PRODUCT = 'Desktop Shell Journey'
const DIRECT_DEPS = ['app-menu', 'css-engine', 'global-shortcuts', 'jsx', 'linux-gtk', 'platform', 'tray', 'ui', 'camera', 'lib']
const CONTAINER = join(here, 'linux/container')

const evidence = { product: 'desktop-shell', platform: 'linux-gtk', phase: PHASE, result: 'fail', steps: [], artifacts: {}, environment: {} }

const log = (m) => console.log(`[desktop-shell-linux] ${m}`)
const sha256 = (p) => createHash('sha256').update(readFileSync(p)).digest('hex')
const quote = (s) => "'" + s.replaceAll("'", "'\\''") + "'"
const ssh = (cmd, opts = {}) =>
  execFileSync('ssh', ['-o', 'BatchMode=yes', '-o', 'ConnectTimeout=10', REMOTE, cmd], { encoding: 'utf8', timeout: opts.timeout ?? 300000 })
const remoteWrite = (path, content) =>
  execFileSync('ssh', ['-o', 'BatchMode=yes', REMOTE, `cat > ${quote(path)}`], { input: content })

function packageDirs() {
  const dirs = new Map()
  for (const name of readdirSync(join(repo, 'packages'))) {
    const pkg = join(repo, 'packages', name, 'package.json')
    if (!existsSync(pkg)) continue
    const manifest = JSON.parse(readFileSync(pkg, 'utf8'))
    if (manifest.name?.startsWith('@octane-xplat/')) dirs.set(manifest.name, join(repo, 'packages', name))
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
    for (const dep of Object.keys(manifest.dependencies ?? {})) if (dirs.has(dep)) queue.push(dep)
  }
  return { dirs, names }
}

async function packOne(dir, packs) {
  const manifest = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'))
  await execAsync('bun', ['pm', 'pack', '--ignore-scripts', '--destination', packs], { cwd: dir })
  return `file:${join(packs, `${manifest.name.replace('@', '').replace('/', '-')}-${manifest.version}.tgz`)}`
}

async function buildPhase() {
  const packs = join(WORK, 'packs')
  mkdirSync(packs, { recursive: true })
  const consumer = join(WORK, 'consumer')
  const { dirs, names } = workspaceClosure(DIRECT_DEPS)
  log(`workspace closure (${names.size}): ${[...names].join(', ')}`)

  const tarballs = {}
  for (const name of [...names].sort()) tarballs[name] = await packOne(dirs.get(name), packs)
  for (const required of ['@octane-xplat/tray', '@octane-xplat/app-menu', '@octane-xplat/global-shortcuts', '@octane-xplat/linux-gtk']) {
    const list = execFileSync('tar', ['-tzf', tarballs[required].replace(/^file:/, '')], { encoding: 'utf8' })
    if (!list.includes('package/dist/')) throw new Error(`${required} tarball ships no dist/`)
  }
  log('tray/app-menu/global-shortcuts/linux-gtk tarballs ship dist/')

  rmSync(join(packs, 'native-cli'), { recursive: true, force: true })
  const stagedCli = stageHostCli(repo, join(packs, 'native-cli'))
  const cli = `file:${stagedCli.cli.archive}`
  const extra = {}
  for (const p of ['toolchain', 'docs-search', 'lib', 'lint', 'create']) {
    extra[p] = await packOne(join(repo, `packages/${p}`), packs)
  }
  const compatibility = JSON.parse(await readFile(join(repo, 'packages/create/compatibility.json'), 'utf8'))

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
      '@octane-xplat/linux-gtk': tarballs['@octane-xplat/linux-gtk'],
      '@octane-xplat/platform': tarballs['@octane-xplat/platform'],
      '@octane-xplat/tray': tarballs['@octane-xplat/tray'],
      '@octane-xplat/ui': tarballs['@octane-xplat/ui'],
      octane: compatibility.packages.octane.version,
    },
    devDependencies: {
      'octane-xplat': extra['toolchain'],
      '@octane-xplat/cli': cli,
      '@octanejs/vite-plugin': compatibility.packages['@octanejs/vite-plugin'].version,
      '@tsrx/oxc': compatibility.packages['@tsrx/oxc'].version,
      vite: compatibility.packages.vite.version,
      typescript: compatibility.packages.typescript.version,
    },
    xplat: {
      targets: {
        linux: {
          runtime: 'gtk',
          package: {
            applicationId: APP_ID,
            productName: PRODUCT,
            executableName: APP_NAME,
            version: '0.1.0',
            viteConfig: 'vite.gtk.config.ts',
          },
        },
      },
    },
    overrides: {
      ...Object.fromEntries(stagedCli.payloads.map((p) => [p.manifest.name, `file:${p.archive}`])),
      'create-octane-xplat': extra['create'],
      '@octane-xplat/docs-search': extra['docs-search'],
      '@octane-xplat/lib': extra['lib'],
      '@octane-xplat/lint': extra['lint'],
      ...Object.fromEntries(Object.entries(tarballs).map(([n, t]) => [n, t])),
    },
    packageManager: 'bun@1.4.4',
  }

  await writeFile(join(consumer, 'package.json'), JSON.stringify(consumerPkg, null, 2))
  await writeFile(join(consumer, 'bunfig.toml'), '[install]\nlinker = "isolated"\n')
  await writeFile(
    join(consumer, 'tsconfig.json'),
    JSON.stringify(
      {
        contentMappers: [{ package: 'octane-xplat', extensions: ['.tsrx'] }],
        compilerOptions: {
          strict: true, target: 'ESNext', module: 'ESNext', moduleResolution: 'bundler',
          jsx: 'preserve', jsxImportSource: '@octane-xplat/jsx',
          moduleSuffixes: ['', '.gtk'], lib: ['ESNext', 'DOM', 'DOM.Iterable'],
          types: ['vite/client'], noEmit: true, skipLibCheck: true,
          allowImportingTsExtensions: true,
        },
        include: ['src/**/*'],
        exclude: ['node_modules'],
      },
      null, 2,
    ),
  )

  const srcDir = join(consumer, 'src')
  mkdirSync(srcDir, { recursive: true })
  for (const file of readdirSync(join(here, 'app'))) {
    if (file === 'main.macos.ts') continue
    cpSync(join(here, 'app', file), join(srcDir, file))
  }
  await writeFile(join(srcDir, 'version.ts'), "export const APP_VERSION = '0.1.0'\nexport const STATUS_SUFFIX = ''\n")
  await writeFile(
    join(consumer, 'vite.gtk.config.ts'),
    "import { defineConfig } from 'vite'\nimport { xplatLinuxGtk } from '@octane-xplat/cli/linux-gtk/vite'\n\nexport default defineConfig(({ mode }) => xplatLinuxGtk(mode, { entry: 'src/main.gtk.ts' }))\n",
  )

  log('installing consumer')
  await execAsync('bun', ['install', '--ignore-scripts'], { cwd: consumer })
  repairPackedCli(consumer)
  await execAsync('bun', ['run', 'xplat', 'patches', 'apply'], { cwd: consumer })
  await execAsync('bun', ['install', '--ignore-scripts', '--no-frozen-lockfile'], { cwd: consumer })
  await execAsync('bun', ['run', 'xplat', 'typecheck'], { cwd: consumer, timeout: 300000 })
  log('consumer typecheck passed')

  const outDir = join(consumer, 'dist/linux')
  const archives = {}
  for (const [label, version, suffix] of [['v1', '0.1.0', ''], ['v2', '0.2.0', ' (v2)']]) {
    const manifestPath = join(consumer, 'package.json')
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
    manifest.xplat.targets.linux.package.version = version
    await writeFile(manifestPath, JSON.stringify(manifest, null, 2))
    await writeFile(join(srcDir, 'version.ts'), `export const APP_VERSION = '${version}'\nexport const STATUS_SUFFIX = '${suffix}'\n`)

    rmSync(outDir, { recursive: true, force: true })
    log(`xplat build --targets linux (${label} ${version})`)
    await execAsync('bun', ['run', 'xplat', 'build', '--targets', 'linux'], { cwd: consumer, timeout: 600000 })

    const bundle = readdirSync(join(consumer, 'dist/package-build')).find((f) => /\.(c?js|mjs)$/.test(f))
    if (bundle) {
      const bundled = readFileSync(join(consumer, 'dist/package-build', bundle), 'utf8')
      if (/https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0|::1)/.test(bundled) || /\/@vite\/client|vite\.dev\./i.test(bundled)) {
        throw new Error('packaged bundle carries dev-server/HMR client URLs')
      }
    }

    const archive = readdirSync(outDir).find((f) => f.endsWith('.tar.gz'))
    if (!archive || !existsSync(join(outDir, APP_NAME))) throw new Error(`build produced no archive/app under ${outDir}`)
    const kept = join(WORK, `${APP_NAME}-${label}.tar.gz`)
    cpSync(join(outDir, archive), kept)
    archives[label] = kept
    evidence.artifacts[`${label}Archive`] = { path: kept, sha256: sha256(kept) }
    log(`${label}: ${kept}`)
  }

  evidence.artifacts.tarballs = Object.fromEntries(
    Object.entries(tarballs).map(([n, t]) => [n, { path: t, sha256: sha256(t.replace(/^file:/, '')) }]),
  )
  log('build phase complete')
  return archives
}

async function journeyPhase() {
  const remoteDir = `~/agent-scratch/octane-xplat/hushed-dew/linux-run-1`
  ssh(`mkdir -p ${remoteDir}`)
  remoteWrite(`${remoteDir}/README.md`, 'Everything in this folder is disposable.\n')
  const v1 = join(WORK, `${APP_NAME}-v1.tar.gz`)
  const v2 = join(WORK, `${APP_NAME}-v2.tar.gz`)
  execFileSync('scp', ['-o', 'BatchMode=yes', v1, `${REMOTE}:${remoteDir}/app-v1.tar.gz`])
  execFileSync('scp', ['-o', 'BatchMode=yes', v2, `${REMOTE}:${remoteDir}/app-v2.tar.gz`])
  for (const f of ['Dockerfile', 'watcher.js', 'ax.py', 'run.sh']) {
    execFileSync('scp', ['-o', 'BatchMode=yes', join(CONTAINER, f), `${REMOTE}:${remoteDir}/${f}`])
  }
  log(`staged on ${REMOTE}:${remoteDir}`)

  const image = `xplat-dshell-${Date.now()}`
  try {
    const output = ssh(`cd ${remoteDir} && docker build -q -t ${image} . >/dev/null && docker run --rm ${image} 2>&1`, { timeout: 600000 })
    const appLog = output
    writeFileSync(join(WORK, 'journey-output.log'), appLog)
    for (const line of appLog.split('\n')) {
      const m = line.match(/^STEP\|([^|]+)\|([^|]+)\|([^|]+)\|(.*)$/)
      if (m) {
        evidence.steps.push({ step: m[1], inputClass: m[2], result: m[3], detail: m[4] })
        log(`  ${m[3] === 'pass' ? '✔' : m[3] === 'blocked' ? '⊘' : '✖'} ${m[1]}`)
      }
    }
  } finally {
    try { ssh(`docker rmi ${image} >/dev/null 2>&1 || true; rm -rf ${remoteDir}`) } catch {}
  }

  if (evidence.steps.some((s) => s.result === 'fail')) evidence.result = 'fail'
  else if (evidence.steps.some((s) => s.result === 'blocked')) evidence.result = 'blocked'
  else if (evidence.steps.length) evidence.result = 'pass'
}

mkdirSync(WORK, { recursive: true })
try {
  if (PHASE === 'build' || PHASE === 'all') await buildPhase()
  if (PHASE === 'journey' || PHASE === 'all') await journeyPhase()
} catch (e) {
  evidence.result = 'fail'
  evidence.error = String(e && e.message ? e.message : e)
} finally {
  evidence.environment = {
    macos: (() => { try { return execFileSync('sw_vers', ['-productVersion'], { encoding: 'utf8' }).trim() } catch { return 'unknown' } })(),
    journeyHost: REMOTE,
    containerImage: 'debian:trixie + gjs/gtk4/xvfb/xdotool/pyatspi/xdg-desktop-portal-kde',
  }
  evidence.sourceCommit = (() => { try { return execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repo, encoding: 'utf8' }).trim() } catch { return 'unknown' } })()
  writeFileSync(join(WORK, 'evidence.json'), JSON.stringify(evidence, null, 2))
  log(`evidence: ${join(WORK, 'evidence.json')}`)
}
process.exit(evidence.result === 'pass' ? 0 : 1)
