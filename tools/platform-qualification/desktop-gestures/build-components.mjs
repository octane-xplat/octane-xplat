import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { cp, mkdir, readdir, readFile, realpath, symlink, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'vite'
import { linuxGtk } from '../../../packages/cli/src/linux-gtk/vite.ts'
import { native } from '../../../packages/cli/src/vite.ts'
import { macos } from '../../../packages/cli/src/macos/vite.ts'

const here = dirname(fileURLToPath(import.meta.url))
const repo = resolve(here, '../../..')
const [target, destination, mode] = process.argv.slice(2)

if (!['gtk', 'macos', 'windows'].includes(target) || !destination) {
  throw new Error('Usage: build-components.mjs gtk|macos|windows /absolute/owned/consumer')
}

const app = resolve(destination)
const packs = join(app, 'packs')
const artifacts = []

if (mode === '--fixture-only') {
  const manifest = JSON.parse(await readFile(join(app, 'package.json'), 'utf8'))
  const previous = JSON.parse(await readFile(join(app, 'evidence.json'), 'utf8'))

  if (
    manifest.name !== 'packed-desktop-gestures' ||
    !manifest.private ||
    previous.target !== target
  ) {
    throw new Error('Fixture-only rebuild requires a matching owned packed consumer')
  }

  artifacts.push(...previous.artifacts)
} else {
  await mkdir(dirname(app), { recursive: true })
  await mkdir(app)
  await mkdir(packs, { recursive: true })
  await mkdir(join(app, 'node_modules'), { recursive: true })
  await writeFile(
    join(app, 'package.json'),
    JSON.stringify({ name: 'packed-desktop-gestures', private: true, type: 'module' }),
  )

  // Reuse the contributor's already installed compiler/runtime dependencies.
  // The libraries under qualification are extracted tarballs, never links to
  // their source. This is a packed-content gate, not a frozen fresh-install gate.
  for (const modules of [
    join(repo, target === 'windows' ? 'apps/windows/node_modules' : 'apps/macos/node_modules'),
    join(repo, 'node_modules'),
    ...[
      'motion',
      'ui',
      'jsx',
      'platform',
      'css-engine',
      'linux-gtk-renderer',
      'macos-appkit',
      'camera',
      'lib',
    ].map((name) => join(repo, 'packages', name, 'node_modules')),
  ]) {
    if (!existsSync(modules)) {
      continue
    }

    for (const entry of await readdir(modules, { withFileTypes: true })) {
      if (entry.name.startsWith('.')) {
        continue
      }

      const source = join(modules, entry.name)

      if (entry.name.startsWith('@')) {
        await mkdir(join(app, 'node_modules', entry.name), { recursive: true })
        for (const name of await readdir(source)) {
          if (
            entry.name === '@octane-xplat' &&
            [
              'ui',
              'motion',
              'jsx',
              'platform',
              'css-engine',
              'linux-gtk',
              'macos-appkit',
              'camera',
              'lib',
            ].includes(name)
          ) {
            continue
          }

          const targetPath = join(app, 'node_modules', entry.name, name)

          if (!existsSync(targetPath)) {
            await symlink(await realpath(join(source, name)), targetPath)
          }
        }
      } else {
        const targetPath = join(app, 'node_modules', entry.name)

        if (!existsSync(targetPath)) {
          await symlink(await realpath(source), targetPath)
        }
      }
    }
  }

  for (const directory of [
    'ui',
    'motion',
    'jsx',
    'platform',
    'css-engine',
    'camera',
    'lib',
    ...(target === 'windows' ? [] : [target === 'gtk' ? 'linux-gtk-renderer' : 'macos-appkit']),
  ]) {
    const source = join(repo, 'packages', directory)
    const manifest = JSON.parse(await readFile(join(source, 'package.json'), 'utf8'))
    const tarball = join(packs, directory + '.tgz')

    execFileSync('bun', ['pm', 'pack', '--ignore-scripts', '--quiet', '--filename', tarball], {
      cwd: source,
    })

    const installed = join(app, 'node_modules', manifest.name)

    await mkdir(installed, { recursive: true })
    execFileSync('tar', ['-xzf', tarball, '--strip-components=1', '-C', installed])
    artifacts.push({
      name: manifest.name,
      version: manifest.version,
      sha256: createHash('sha256')
        .update(await readFile(tarball))
        .digest('hex'),
    })
  }

  await writeFile(
    join(app, 'package.json'),
    JSON.stringify(
      {
        name: 'packed-desktop-gestures',
        private: true,
        type: 'module',
        dependencies: Object.fromEntries(
          artifacts.map((artifact) => [artifact.name, artifact.version]),
        ),
      },
      null,
      2,
    ),
  )
}

for (const name of ['components.tsrx', 'scene.ts', `components.${target}.ts`]) {
  await cp(join(here, name), join(app, name))
}

if (target === 'macos') {
  await cp(join(repo, 'tools/probe/appkit-input.ts'), join(app, 'appkit-input.ts'))
}

let config

if (target === 'windows') {
  const original = JSON.parse(await readFile(join(repo, 'apps/windows/package.json'), 'utf8'))
  const manifest = JSON.parse(await readFile(join(app, 'package.json'), 'utf8'))

  for (const name of [
    '@nativescript/core',
    '@nativescript/windows',
    '@nativescript-community/octane',
    '@octane-xplat/nativescript-masonkit',
  ]) {
    manifest.dependencies[name] = original.dependencies[name] ?? original.devDependencies[name]
  }

  manifest.main = 'src/index.ts'
  await writeFile(join(app, 'package.json'), JSON.stringify(manifest, null, 2))
  await mkdir(join(app, 'src'), { recursive: true })
  await writeFile(join(app, 'src/index.ts'), "import '../components.windows.ts'\n")
  await writeFile(
    join(app, 'nativescript.config.ts'),
    `export default {id:'org.octanexplat.packedgestures',appPath:'src',appResourcesPath:'App_Resources',bundler:'vite'}`,
  )

  process.env.NATIVESCRIPT_BUNDLER_ENV = JSON.stringify({ platform: 'windows', windows: true })
  process.chdir(app)
  config = await native('production', {
    extra: {
      root: app,
      build: { outDir: join(app, 'dist') },
      resolve: { dedupe: ['@nativescript/core', '@nativescript-community/octane'] },
    },
  })
} else {
  const preset = target === 'gtk' ? linuxGtk : macos

  config = await preset('production', {
    root: app,
    entry: join(app, `components.${target}.ts`),
    outDir: join(app, 'dist'),
    packaged: true,
  })
}

const resolved = new Set()
const testedSources = artifacts.map((artifact) => {
  const name = artifact.name.slice('@octane-xplat/'.length)

  return join(repo, 'packages', name === 'linux-gtk' ? 'linux-gtk-renderer' : name) + '/'
})

// Native bundler plugins may register process error handlers. Only an explicit
// completed build should leave a successful exit status.
process.exitCode = 1
await build({
  ...config,
  configFile: false,
  logLevel: 'error',
  plugins: [
    ...config.plugins,
    {
      name: 'observe-packed-gesture-modules',
      transform(_code, id) {
        if (testedSources.some((prefix) => id.startsWith(prefix))) {
          throw new Error('Source checkout leaked into packed gesture consumer: ' + id)
        }

        if (id.startsWith(join(app, 'node_modules', '@octane-xplat'))) {
          resolved.add(id.slice(app.length + 1))
        }
      },
    },
  ],
})

const digest = (bytes) => createHash('sha256').update(bytes).digest('hex')
const fixtures = await Promise.all(
  [
    'components.tsrx',
    'scene.ts',
    `components.${target}.ts`,
    ...(target === 'macos' ? ['appkit-input.ts'] : []),
  ].map(async (path) => ({ path, sha256: digest(await readFile(join(app, path))) })),
)

const bundles = []

for (const entry of await readdir(join(app, 'dist'), { recursive: true, withFileTypes: true })) {
  if (entry.isFile() && /\.(?:[cm]?js|css|json)$/.test(entry.name)) {
    const path = join(entry.parentPath, entry.name)

    bundles.push({ path: path.slice(app.length + 1), sha256: digest(await readFile(path)) })
  }
}

await writeFile(
  join(app, 'evidence.json'),
  JSON.stringify(
    {
      target,
      artifacts,
      fixtures,
      bundles: bundles.sort((a, b) => a.path.localeCompare(b.path)),
      resolved: [...resolved].sort(),
      reuse:
        'External toolchain dependencies reused; tested framework packages extracted from tarballs.',
    },
    null,
    2,
  ) + '\n',
)

console.log('PACKED_DESKTOP_BUILD ' + app)
process.exitCode = 0
