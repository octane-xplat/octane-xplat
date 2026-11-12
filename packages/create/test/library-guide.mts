/** Focused app/library artifact qualification. No devices, browsers or images. */
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
  existsSync,
  realpathSync,
  cpSync,
  chmodSync,
} from 'node:fs'

import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
const work = mkdtempSync(join(tmpdir(), 'xplat-library-guide-'))
const pack = join(work, 'pack')

mkdirSync(pack)

function run(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 })

  if (result.stdout && args[1] !== 'pack' && args[0] !== '-tzf') {
    process.stdout.write(result.stdout)
  }

  if (result.stderr) {
    process.stderr.write(result.stderr)
  }

  assert.equal(result.status, 0, `${command} ${args.join(' ')} failed`)
  return result.stdout
}

const tarballs = new Map()
const platform = process.platform === 'win32' ? 'windows' : process.platform
const arch = process.arch === 'x64' ? 'amd64' : process.arch
const binaryName = `xplat-go-${platform}-${arch}-cli${platform === 'windows' ? '.exe' : ''}`
const nativeCLI = join(repo, 'research/go-cli', binaryName)

function packPackage(root) {
  const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))

  run('bun', ['pm', 'pack', '--ignore-scripts', '--destination', pack], root)

  const path = join(
    pack,
    `${manifest.name.replace('@', '').replace('/', '-')}-${manifest.version}.tgz`,
  )

  tarballs.set(manifest.name, path)
  return path
}

function prepare(root) {
  const path = join(root, 'package.json')
  const config = JSON.parse(readFileSync(path, 'utf8'))

  config.overrides ??= {}
  for (const [name, path] of tarballs) {
    config.overrides[name] = `file:${path}`
  }

  writeFileSync(path, JSON.stringify(config, null, '\t') + '\n')
  run('bun', ['install'], root)

  // Raw package packs use the repository launcher; release staging owns bin rewriting.
  // Place the tested native companion only inside this isolated temporary install.
  const require = createRequire(join(root, 'package.json'))
  let manifestPath

  try {
    manifestPath = require.resolve('@octane-xplat/cli/package.json')
  } catch {
    manifestPath = createRequire(require.resolve('octane-xplat/vite')).resolve(
      '@octane-xplat/cli/package.json',
    )
  }

  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
  const launcher = realpathSync(resolve(dirname(manifestPath), manifest.bin.xplat))
  const payload = resolve(dirname(launcher), '../../../research/go-cli', binaryName)

  assert.ok(
    payload.startsWith(realpathSync(work) + '/'),
    'fixture payload must remain inside owned temporary storage',
  )

  mkdirSync(dirname(payload), { recursive: true })
  cpSync(nativeCLI, payload)
  chmodSync(payload, 0o755)
}

try {
  const packages = new Map(
    readdirSync(join(repo, 'packages')).flatMap((directory) => {
      const root = join(repo, 'packages', directory)

      if (!existsSync(join(root, 'package.json'))) {
        return []
      }

      const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))

      return [[manifest.name, { root, manifest }]]
    }),
  )

  const wanted = new Set()
  function include(name) {
    if (wanted.has(name) || !packages.has(name)) {
      return
    }

    wanted.add(name)

    const { manifest } = packages.get(name)

    for (const dependency of Object.keys(manifest.dependencies ?? {})) {
      include(dependency)
    }

    for (const dependency of Object.keys(manifest.peerDependencies ?? {})) {
      if (!manifest.peerDependenciesMeta?.[dependency]?.optional) {
        include(dependency)
      }
    }
  }

  for (const name of [
    'create-octane-xplat',
    '@octane-xplat/workshop',
    'tsrx-typegen',
    '@octane-xplat/patches',
    'octane-xplat',
  ]) {
    include(name)
  }

  for (const name of wanted) {
    packPackage(packages.get(name).root)
  }

  writeFileSync(
    join(work, 'package.json'),
    JSON.stringify({
      private: true,
      dependencies: { 'create-octane-xplat': `file:${tarballs.get('create-octane-xplat')}` },
    }),
  )

  run('bun', ['install', '--ignore-scripts'], work)

  const creator = join(work, 'node_modules/create-octane-xplat/dist/index.js')
  const library = join(work, 'travel-controls')
  const app = join(work, 'travel-app')

  run(
    process.execPath,
    [
      creator,
      library,
      '--template',
      'library',
      '--name',
      '@example/travel-controls',
      '--no-install',
    ],
    work,
  )

  // A non-code asset must survive the same source files whitelist.
  mkdirSync(join(library, 'src/assets'))
  writeFileSync(join(library, 'src/assets/packing.txt'), 'Passport\nCharger\n')
  prepare(library)
  for (const task of ['typegen', 'typecheck', 'lint', 'test', 'test:packed']) {
    run('bun', ['run', task], library)
  }

  run('bun', ['run', 'tsrx-typegen', '--target', 'octane', '--check'], library)

  const artifact = packPackage(library)
  const listing = run('tar', ['-tzf', artifact], work)

  assert.doesNotMatch(
    listing,
    /\.stories\./,
    'published library must exclude Workshop stories and their declarations',
  )

  for (const path of [
    'package/src/Badge.tsx',
    'package/src/Badge.web.tsx',
    'package/types/index.d.ts',
    'package/src/assets/packing.txt',
  ]) {
    assert.ok(listing.includes(path), `missing ${path}`)
  }

  run(process.execPath, [creator, app, '--targets', 'web', '--no-install'], work)

  const manifestPath = join(app, 'package.json')
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))

  manifest.dependencies['@example/travel-controls'] = `file:${artifact}`
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))
  writeFileSync(
    join(app, 'src/main.web.tsrx'),
    `/** @jsxImportSource @octane-xplat/jsx/dom */
import { createRoot } from 'octane'
import { Badge } from '@example/travel-controls'
createRoot(document.getElementById('root')!).render(<Badge label="Packed library ready" />)
`,
  )

  const viteConfig = join(app, 'vite.config.ts')

  writeFileSync(
    viteConfig,
    readFileSync(viteConfig, 'utf8').replace(
      'plugins: [',
      `plugins: [{
 name: 'qualify-installed-library-leaf',
 generateBundle() {
  const modules = [...this.getModuleIds()].filter(id => id.includes('/@example/travel-controls/src/'))
  if (!modules.some(id => id.endsWith('/Badge.web.tsx')) || modules.some(id => id.endsWith('/Badge.tsx'))) {
   throw new Error('The consuming web app did not select the installed browser library leaf')
  }
 }
}, `,
    ),
  )

  prepare(app)
  for (const task of ['typecheck', 'build']) {
    run('bun', ['run', task], app)
  }

  const output = readdirSync(join(app, 'dist/assets'))
    .filter((name) => name.endsWith('.js'))
    .map((name) => readFileSync(join(app, 'dist/assets', name), 'utf8'))
    .join('\n')

  assert.ok(
    output.includes('Packed library ready'),
    'installed library was not compiled into the web bundle',
  )

  console.log(
    'PASS library guide: packed creator, isolated install, generated types, four plain TypeScript consumers, packed source/assets and consuming web production build. No native/browser runtime qualification.',
  )
} finally {
  rmSync(work, { recursive: true, force: true })
}
