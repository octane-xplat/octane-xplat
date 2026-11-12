import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync, spawn } from 'node:child_process'
import { once } from 'node:events'
import { createRequire } from 'node:module'
import { setTimeout as delay } from 'node:timers/promises'
import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  existsSync,
  rmSync,
  realpathSync,
  renameSync,
} from 'node:fs'

import { join, resolve, dirname } from 'node:path'
import { stageRelease } from './stage-release.mjs'
import { nativeFixture, hostTarget } from './stage-fixture.mjs'
import { scratchRun } from './scratch.mjs'
import { sha256 } from './native-inputs.mjs'

const root = resolve(import.meta.dirname, '../..')
const binary = join(
  root,
  `research/go-cli/xplat-go-${hostTarget}-cli${process.platform === 'win32' ? '.exe' : ''}`,
)

function run(exe, args, options = {}) {
  return spawnSync(exe, args, { encoding: 'utf8', timeout: 60000, ...options })
}

function success(result) {
  assert.ifError(result.error)
  assert.equal(result.status, 0, result.stdout + result.stderr)
  return result
}

test('production layout selects only the host payload and installs a direct native bin', async (t) => {
  const scratch = realpathSync(scratchRun(root, 'go-registry-consumer'))
  let registry, closed

  t.after(async () => {
    if (registry && registry.exitCode === null && registry.signalCode === null) {
      registry.kill('SIGKILL')
    }

    if (closed) {
      await closed
    }

    rmSync(scratch, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 })
  })

  const nativeDir = nativeFixture(root, binary)

  t.after(() => rmSync(nativeDir, { recursive: true, force: true }))

  const staged = stageRelease({
    root,
    version: JSON.parse(readFileSync(join(root, 'packages/cli/package.json'))).version,
    nativeDir,
    outputDir: join(scratch, 'stage'),
  })

  const build = JSON.parse(readFileSync(binary + '.json'))
  // The scoped .npmrc sends every @octane-xplat/* dependency to the private
  // registry, so serve each of the CLI's scoped deps there too.
  const depPackages = []

  for (const [name, dir] of [
    ['@octane-xplat/docs-search', 'docs-search'],
    ['@octane-xplat/lib', 'lib'],
    ['@octane-xplat/lint', 'lint'],
    ['create-octane-xplat', 'create'],
    ['octane-xplat', 'toolchain'],
  ]) {
    const depTarball = join(scratch, dir + '.tgz')

    // `bun pm pack` packs the current workspace; it ignores a path argument.
    success(
      run('bun', ['pm', 'pack', '--ignore-scripts', '--filename', depTarball], {
        cwd: join(root, 'packages', dir),
      }),
    )

    depPackages.push({
      manifest: {
        name,
        version: JSON.parse(readFileSync(join(root, 'packages', dir, 'package.json'))).version,
      },
      archive: depTarball,
    })
  }

  // fmt is a published external dep — serve the installed copy's tarball.
  const fmtVersion = JSON.parse(
    readFileSync(join(root, 'node_modules/@octane-xplat/fmt/package.json')),
  ).version

  success(
    run(
      'bun',
      [
        'pm',
        'pack',
        '--ignore-scripts',
        '--filename',
        join(scratch, `octane-xplat-fmt-${fmtVersion}.tgz`),
      ],
      { cwd: realpathSync(join(root, 'node_modules/@octane-xplat/fmt')) },
    ),
  )

  depPackages.push({
    manifest: { name: '@octane-xplat/fmt', version: fmtVersion },
    archive: join(scratch, `octane-xplat-fmt-${fmtVersion}.tgz`),
  })

  const packages = [
    { manifest: staged.cli.manifest, archive: staged.cli.archive },
    ...staged.payloads.map((item) => ({ manifest: item.manifest, archive: item.archive })),
    ...depPackages,
  ]

  const artifacts = packages.map(({ manifest, archive }) => {
    const bytes = readFileSync(archive)

    return { name: manifest.name, sha256: sha256(bytes) }
  })

  const pkg = staged.cli.manifest

  assert.equal(pkg.private, undefined)
  assert.equal(pkg.os, undefined)
  assert.equal(pkg.cpu, undefined)
  assert.equal(pkg.scripts.postinstall, 'node install-native.mjs')

  const ready = join(scratch, 'ready.json'),
    requests = join(scratch, 'requests.json')

  const input = join(scratch, 'registry.json')

  // The umbrella-only install below adds metadata and tarball requests.
  writeFileSync(input, JSON.stringify({ packages, ready, requests, maxRequests: 128 }))
  registry = spawn(
    process.execPath,
    [join(root, 'tools/cli-go/upgrade-registry-fixture.mjs'), input],
    { stdio: 'ignore' },
  )

  closed = once(registry, 'close')

  const deadline = Date.now() + 10000

  while (!existsSync(ready)) {
    assert.equal(registry.exitCode, null, 'Private registry exited before readiness')
    assert.ok(Date.now() < deadline, 'Private registry readiness timeout')
    await delay(20)
  }

  const port = JSON.parse(readFileSync(ready)).port
  const expected = `@octane-xplat/cli-native-${process.platform}-${process.arch}`

  for (const ignoreScripts of [false, true]) {
    const consumer = join(scratch, ignoreScripts ? 'manual Ω' : 'automatic Ω')

    mkdirSync(consumer)
    writeFileSync(
      join(consumer, 'package.json'),
      JSON.stringify({
        private: true,
        dependencies: { '@octane-xplat/cli': pkg.version },
        trustedDependencies: ['octane-xplat', '@octane-xplat/cli'],
      }),
    )

    writeFileSync(join(consumer, '.npmrc'), `@octane-xplat:registry=http://127.0.0.1:${port}/\n`)

    const env = {
      ...process.env,
      NODE_PATH: '',
      NODE_OPTIONS: '',
      BUN_INSTALL_CACHE_DIR: join(consumer, 'cache'),
    }

    for (const name of Object.keys(env)) {
      if (['npm_config_registry', 'bun_config_registry'].includes(name.toLowerCase())) {
        delete env[name]
      }
    }

    success(
      run(
        'bun',
        ['install', '--linker', 'isolated', ...(ignoreScripts ? ['--ignore-scripts'] : [])],
        { cwd: consumer, env },
      ),
    )

    const installed = realpathSync(join(consumer, 'node_modules/@octane-xplat/cli'))
    const image = join(installed, 'bin/xplat.exe'),
      installer = join(installed, 'install-native.mjs')

    if (ignoreScripts) {
      assert.notEqual(
        sha256(readFileSync(image)),
        build.sha256,
        'Disabled scripts must not masquerade as installed native selection',
      )

      success(run(process.execPath, [installer], { cwd: consumer, env }))
    }

    assert.equal(sha256(readFileSync(image)), build.sha256)
    assert.equal(
      success(run(image, ['--version'], { env: { ...env, PATH: '' } })).stdout.trim(),
      pkg.version,
    )

    assert.equal(
      success(
        run('bun', ['run', '--silent', 'xplat', '--version'], { cwd: consumer, env }),
      ).stdout.trim(),
      pkg.version,
    )

    const require = createRequire(join(installed, 'package.json'))
    const payload = dirname(require.resolve(expected + '/package.json'))

    for (const foreign of artifacts.filter(
      (item) => item.name.startsWith('@octane-xplat/cli-native-') && item.name !== expected,
    )) {
      assert.throws(() => require.resolve(foreign.name + '/package.json'))
    }

    if (ignoreScripts) {
      const source = join(payload, 'xplat.exe'),
        original = source + '.original'

      renameSync(source, original)
      try {
        writeFileSync(source, Buffer.alloc(build.bytes))

        const bad = run(process.execPath, [installer], { cwd: consumer, env })

        assert.notEqual(bad.status, 0)
        assert.match(bad.stderr, /checksum mismatch/)
        assert.equal(sha256(readFileSync(image)), build.sha256)
      } finally {
        rmSync(source, { force: true })
        renameSync(original, source)
      }

      const manifest = join(payload, 'package.json')

      renameSync(manifest, manifest + '.original')
      try {
        const missing = run(process.execPath, [installer], { cwd: consumer, env })

        assert.notEqual(missing.status, 0)
        assert.match(missing.stderr, /optional dependencies enabled/)
        assert.equal(sha256(readFileSync(image)), build.sha256)
      } finally {
        renameSync(manifest + '.original', manifest)
      }
    }
  }

  const seen = JSON.parse(readFileSync(requests))

  assert.ok(
    seen.includes('/package-0.tgz'),
    'The main package must be downloaded from the private registry',
  )

  const selectedIndex = packages.findIndex((item) => item.manifest.name === expected)

  assert.ok(seen.includes(`/package-${selectedIndex}.tgz`), 'The host binary must be downloaded')
  for (let index = 1; index < packages.length; index++) {
    if (
      index !== selectedIndex &&
      packages[index].manifest.name.startsWith('@octane-xplat/cli-native-')
    ) {
      assert.ok(!seen.includes(`/package-${index}.tgz`), 'Do not download foreign native payloads')
    }
  }

  // Production path: an app declares only the umbrella; the CLI arrives
  // transitively and its postinstall must still run under trustedDependencies.
  const app = join(scratch, 'umbrella app')

  mkdirSync(app)
  writeFileSync(
    join(app, 'package.json'),
    JSON.stringify({
      private: true,
      dependencies: {
        'octane-xplat': `file:${depPackages.find((item) => item.manifest.name === 'octane-xplat').archive}`,
      },
      trustedDependencies: ['octane-xplat', '@octane-xplat/cli'],
    }),
  )

  writeFileSync(join(app, '.npmrc'), `@octane-xplat:registry=http://127.0.0.1:${port}/\n`)

  const appEnv = {
    ...process.env,
    NODE_PATH: '',
    NODE_OPTIONS: '',
    BUN_INSTALL_CACHE_DIR: join(app, 'cache'),
  }

  for (const name of Object.keys(appEnv)) {
    if (['npm_config_registry', 'bun_config_registry'].includes(name.toLowerCase())) {
      delete appEnv[name]
    }
  }

  success(run('bun', ['install', '--linker', 'isolated'], { cwd: app, env: appEnv }))

  const transitive = run('find', [join(app, 'node_modules/.bun'), '-name', 'xplat.exe'], {
    encoding: 'utf8',
  })

  const transitiveBin = transitive.stdout.split('\n').find(Boolean)

  if (!transitiveBin) {
    console.error('find stderr:', transitive.stderr)
    console.error(
      'bun ls:',
      run('ls', [join(app, 'node_modules'), join(app, 'node_modules/.bun')], {
        encoding: 'utf8',
      }).stdout,
    )
  }

  assert.ok(transitiveBin, 'transitive CLI package must install its bin path')
  assert.equal(
    sha256(readFileSync(transitiveBin)),
    build.sha256,
    'transitive postinstall must select the host payload',
  )

  // The umbrella command itself must execute without Node.
  const appLauncher = join(app, 'node_modules/.bin/xplat')

  assert.equal(
    success(run(appLauncher, ['--version'], { env: { ...appEnv, PATH: '' } })).stdout.trim(),
    pkg.version,
    'umbrella bin must launch the transitively-installed native CLI',
  )
})
