// Isolated packed macOS toolchain; no CLI runtime or visual inspection.
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { join, dirname, resolve, relative } from 'node:path'
import {
  mkdirSync,
  writeFileSync,
  readFileSync,
  existsSync,
  readdirSync,
  lstatSync,
  readlinkSync,
  realpathSync,
  renameSync,
  symlinkSync,
  rmSync,
} from 'node:fs'

import { packageMacOS } from '../../packages/cli/src/macos/package.ts'
import { scratchRun } from './scratch.mjs'

if (process.platform !== 'darwin') {
  console.log('macOS execution required; no qualification on this host')
  process.exit(0)
}

const root = resolve(import.meta.dirname, '../..')
const scratch = scratchRun(root, 'macos-build'),
  app = join(scratch, 'app'),
  packs = join(scratch, 'packs')

mkdirSync(app)
mkdirSync(packs)

const evidence = { platform: process.platform, arch: process.arch, checks: [] }
function checked(message) {
  evidence.checks.push(message)
  write(join(root, 'research/go-cli/macos-build-consumer.json'), evidence)
  console.log('Qualified: ' + message)
}

function run(command, args, cwd = app, extra = {}) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
    timeout: 240000,
    maxBuffer: 16 * 1024 * 1024,
    env: {
      ...process.env,
      MACOS_SIGNING_IDENTITY: '',
      MACOS_NOTARY_PROFILE: '',
      XPLAT_MACOS_SKIP_SIGNING: '0',
      NODE_PATH: '',
      NODE_OPTIONS: '',
      ...extra,
    },
  })

  assert.equal(result.status, 0, result.stdout + result.stderr + (result.error?.message ?? ''))
  return result.stdout + result.stderr
}

function write(path, value) {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, typeof value === 'string' ? value : JSON.stringify(value))
}

function pack(path) {
  const manifest = JSON.parse(readFileSync(join(root, path, 'package.json')))

  run('bun', ['pm', 'pack', '--ignore-scripts', '--destination', packs], join(root, path))
  return join(packs, `${manifest.name.replace('@', '').replace('/', '-')}-${manifest.version}.tgz`)
}

function snapshot(path) {
  const files = {}
  function visit(dir) {
    for (const name of readdirSync(dir).sort()) {
      const file = join(dir, name),
        key = relative(path, file),
        stat = lstatSync(file)

      if (stat.isSymbolicLink()) {
        files[key] = 'link:' + readlinkSync(file)
      } else if (stat.isDirectory()) {
        visit(file)
      } else {
        files[key] = createHash('sha256').update(readFileSync(file)).digest('hex')
      }
    }
  }

  visit(path)
  return files
}

try {
  const workerPack = pack('packages/macos-build'),
    cPack = pack('packages/cli/test/fixtures/macos-native-leaves/c')

  evidence.workerTarballBytes = lstatSync(workerPack).size

  const manifest = {
    name: 'macos-build-consumer',
    private: true,
    type: 'module',
    packageManager: 'bun@1.4.4',
    dependencies: {
      octane: '0.17.0',
      '@nativescript/macos-node-api': '0.4.4-next.2026-08-09-31292056208',
      'xplat-native-c-fixture': `file:${cPack}`,
    },
    devDependencies: { vite: '8.3.0', '@octane-xplat/macos-build': `file:${workerPack}` },
    xplat: {
      targets: {
        macos: {
          runtime: 'appkit-node-api',
          package: {
            productName: 'Xplat worker fixture',
            bundleIdentifier: 'org.octane.xplat.worker-fixture',
            executableName: 'XplatWorker',
            version: '0.1.0',
            minimumSystemVersion: '13.5',
            viteConfig: 'vite.config.mjs',
            bundleFile: 'dist/main.cjs',
          },
        },
      },
    },
  }

  write(join(app, 'package.json'), manifest)
  write(
    join(app, 'src/main.macos.js'),
    `import '@nativescript/macos-node-api';\nconst app=NSApplication.sharedApplication;app.setActivationPolicy(2);const value=xplat_c_value();if(value!==40){throw Error('Native compiler value differs')}console.log('XPLAT_MACOS_VALUE='+value);setTimeout(()=>app.terminate(null),30);\n`,
  )

  const config = `export default {build:{outDir:'dist',lib:{entry:'src/main.macos.js',formats:['cjs'],fileName:'main'},rollupOptions:{external:['@nativescript/macos-node-api',/^node:/]}}};\n`

  write(join(app, 'vite.config.mjs'), config)
  run('bun', ['install', '--ignore-scripts', '--linker', 'isolated'])

  const installed = JSON.parse(
    readFileSync(join(app, 'node_modules/@octane-xplat/macos-build/package.json')),
  )

  assert.equal(installed.dependencies, undefined)
  assert.equal(existsSync(join(app, 'node_modules/@octane-xplat/cli')), false)

  const release = join(app, 'artifacts/macos-universal'),
    stage = join(release, '.xplat-macos-raw')

  mkdirSync(stage, { recursive: true })

  const input = join(scratch, 'request.json'),
    output = join(scratch, 'result.json')

  write(input, {
    protocol: 'octane-build-worker',
    version: 1,
    id: 'packed-macos',
    operation: 'macos-package',
    project: app,
    stagingRoot: stage,
  })

  run(process.execPath, [
    join(app, 'node_modules/@octane-xplat/macos-build/dist/macos/package-worker.js'),
    input,
    output,
  ])

  const result = JSON.parse(readFileSync(output))

  assert.equal(result.ok, true, JSON.stringify(result))

  const staged = result.data.appPath,
    stagedDmg = result.data.dmgPath

  assert.equal(staged, join(stage, 'XplatWorker.app'))
  assert.equal(
    existsSync(join(release, 'XplatWorker.app')),
    false,
    'Worker construction must not publish',
  )

  run('codesign', ['--verify', '--deep', '--strict', staged])
  run('hdiutil', ['verify', stagedDmg])
  assert.match(run(join(staged, 'Contents/MacOS/XplatWorker'), []), /XPLAT_MACOS_VALUE=40/)

  const expected = snapshot(staged)

  evidence.appPayloadHashes = expected
  evidence.builtArchitectures = run('lipo', ['-archs', join(staged, 'Contents/MacOS/XplatWorker')])
    .trim()
    .split(/\s+/)
    .sort()

  assert.deepEqual(evidence.builtArchitectures, ['arm64', 'x86_64'])
  checked(
    'isolated worker, native C compilation, staged signed app, verified DMG and headless host-architecture execution',
  )

  const octaneLink = join(app, 'node_modules/octane'),
    hiddenOctane = octaneLink + '-hidden'

  const globalModules = join(scratch, 'global-modules'),
    missingStage = join(release, '.xplat-macos-global')

  mkdirSync(globalModules)
  mkdirSync(missingStage)
  symlinkSync(realpathSync(octaneLink), join(globalModules, 'octane'), 'dir')
  renameSync(octaneLink, hiddenOctane)
  try {
    write(input, {
      protocol: 'octane-build-worker',
      version: 1,
      id: 'global-fallback',
      operation: 'macos-package',
      project: app,
      stagingRoot: missingStage,
    })

    const missing = spawnSync(
      process.execPath,
      [
        join(app, 'node_modules/@octane-xplat/macos-build/dist/macos/package-worker.js'),
        input,
        output,
      ],
      {
        cwd: app,
        encoding: 'utf8',
        timeout: 10000,
        env: {
          ...process.env,
          NODE_PATH: globalModules,
          NODE_OPTIONS: '',
          MACOS_SIGNING_IDENTITY: '',
          MACOS_NOTARY_PROFILE: '',
        },
      },
    )

    assert.equal(missing.status, 1, missing.stdout + missing.stderr)

    const rejected = JSON.parse(readFileSync(output))

    assert.equal(rejected.error.code, 'prerequisite_missing')
    assert.match(rejected.error.message, /Install octane in the selected project/)
  } finally {
    renameSync(hiddenOctane, octaneLink)
    rmSync(missingStage, { recursive: true, force: true })
  }

  checked('global Node module paths cannot supply a missing selected-project dependency')

  // Test-only oracle uses the canonical TypeScript operation, never a runtime CLI fallback.
  const saved = {
    MACOS_SIGNING_IDENTITY: process.env.MACOS_SIGNING_IDENTITY,
    MACOS_NOTARY_PROFILE: process.env.MACOS_NOTARY_PROFILE,
    XPLAT_MACOS_SKIP_SIGNING: process.env.XPLAT_MACOS_SKIP_SIGNING,
  }

  process.env.MACOS_SIGNING_IDENTITY = ''
  process.env.MACOS_NOTARY_PROFILE = ''
  process.env.XPLAT_MACOS_SKIP_SIGNING = '0'
  try {
    await packageMacOS(app)
  } finally {
    for (const [key, value] of Object.entries(saved)) {
      if (value === undefined) {
        delete process.env[key]
      } else {
        process.env[key] = value
      }
    }
  }

  const final = join(release, 'XplatWorker.app')

  assert.deepEqual(
    snapshot(final),
    expected,
    'Canonical reference and packed worker must preserve the complete app payload',
  )

  checked('byte-identical app payload against canonical TypeScript packager')
  write(join(root, 'research/go-cli/macos-build-consumer.json'), evidence)
  console.log(JSON.stringify({ ...evidence, appPayloadHashes: undefined }))
} finally {
  rmSync(scratch, { recursive: true, force: true })
}
