import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { runRendererFixture } from '../../../tools/linux-gtk-tests/renderer-fixture-core.mjs'

const repo = resolve(import.meta.dirname, '../../..')
const root = mkdtempSync(join(tmpdir(), 'xplat-gtk-packed-'))
const app = join(root, 'consumer')
const packages = ['build', 'lib', 'linux-gtk-renderer', 'nativescript-octane', 'css-engine', 'jsx']
const dependencies: Record<string, string> = {}

function run(command: string, args: string[], cwd: string) {
  return execFileSync(command, args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit'],
    timeout: 120_000,
  })
}

try {
  mkdirSync(join(app, 'src'), { recursive: true })
  for (const directory of packages) {
    const source = join(repo, 'packages', directory)
    const { name, version } = JSON.parse(readFileSync(join(source, 'package.json'), 'utf8'))
    run('bun', ['pm', 'pack', '--ignore-scripts', '--destination', root], source)
    dependencies[name] = `file:../${name.slice(1).replace('/', '-')}-${version}.tgz`
  }
  const manifest = JSON.parse(readFileSync(join(repo, 'package.json'), 'utf8'))
  const patches = ['octane@0.17.0', '@nativescript/core@9.1.3', '@nativescript/vite@8.0.20']
  const patchedDependencies = Object.fromEntries(
    patches.map((id) => {
      const original = manifest.patchedDependencies[id]
      const copy = 'patches/' + original.split('/').at(-1)
      mkdirSync(join(app, 'patches'), { recursive: true })
      cpSync(join(repo, original), join(app, copy))
      return [id, copy]
    }),
  )
  writeFileSync(join(app, 'bunfig.toml'), '[install]\nlinker = "isolated"\n')
  writeFileSync(
    join(app, 'package.json'),
    JSON.stringify({
      name: 'xplat-gtk-packed-consumer',
      private: true,
      type: 'module',
      version: '0.1.0',
      scripts: {
        dev: './dist/linux/gtk-core/gtk-core',
      },
      dependencies: { ...dependencies, octane: '0.17.0' },
      devDependencies: {
        vite: manifest.workspaces.catalog.vite,
        '@tsrx/oxc': manifest.workspaces.catalog['@tsrx/oxc'],
      },
      overrides: dependencies,
      patchedDependencies,
      xplat: {
        targets: {
          linux: {
            runtime: 'gtk',
            package: {
              applicationId: 'dev.xplat.GtkCoreTest',
              executableName: 'gtk-core',
              productName: 'GTK Core',
              viteConfig: 'vite.gtk.config.mjs',
            },
          },
        },
      },
    }),
  )
  for (const name of ['core-main.gtk.ts', 'core-app.gtk.tsx']) {
    cpSync(join(import.meta.dirname, 'fixtures', 'src', name), join(app, 'src', name))
  }
  writeFileSync(
    join(app, 'vite.gtk.config.mjs'),
    `
    import { linuxGtk } from '@octane-xplat/build/linux-gtk/vite'
    export default (env) => linuxGtk(env, { entry: 'src/core-main.gtk.ts' })
  `,
  )
  run('bun', ['install', '--backend=hardlink', '--ignore-scripts'], app)
  const require = createRequire(join(app, 'package.json'))
  const preset = require.resolve('@octane-xplat/build/linux-gtk/vite')
  assert.ok(realpathSync(preset).startsWith(realpathSync(app) + '/'))
  assert.ok(
    realpathSync(require.resolve('@octane-xplat/linux-gtk')).startsWith(realpathSync(app) + '/'),
  )
  const rendererRoot = resolve(realpathSync(require.resolve('@octane-xplat/linux-gtk')), '../..')
  run(
    'python3',
    [
      join(repo, 'tools/linux-runtime-release/stage-runtime-release.py'),
      '--output',
      join(rendererRoot, 'platforms/linux/runtime'),
    ],
    repo,
  )
  const packager = resolve(preset, '../../linux/package.js')
  const { packageLinux } = await import(pathToFileURL(packager).href)
  const onLinuxDisplay = process.platform === 'linux' && Boolean(process.env.DISPLAY)
  const release = await packageLinux(app)
  assert.match(run('tar', ['-tzf', release.archive], app), /gtk-core\/app\.js/)
  if (process.env.XPLAT_GTK_REMOTE_PACKED === '1') {
    await runRendererFixture({
      engine: 'native',
      stem: 'packed-core',
      title: 'GTK Core',
      marker: 'GTK_CORE_OK',
      input: false,
      checks: 18,
      packageArchive: release.archive,
      packageLauncher: './gtk-core/gtk-core',
    })
  } else if (onLinuxDisplay) {
    assert.match(run('bun', ['run', 'dev'], app), /GTK_CORE_OK/)
    const extracted = join(root, 'extracted')
    mkdirSync(extracted)
    run('tar', ['-xzf', release.archive, '-C', extracted], root)
    assert.match(run(join(extracted, 'gtk-core', 'gtk-core'), [], root), /GTK_CORE_OK/)
  }
  console.log('GTK_PACKED_OK')
} finally {
  if (process.env.XPLAT_GTK_KEEP_PACKED === '1') {
    console.log(root)
  } else {
    rmSync(root, { recursive: true, force: true })
  }
}
