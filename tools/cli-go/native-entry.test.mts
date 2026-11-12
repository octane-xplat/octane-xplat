// Small package-manager fixtures isolate bin linking from the full dependency
// graph (covered separately by package.test and registry-package.test).
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
  symlinkSync,
} from 'node:fs'

import { join, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { createHash } from 'node:crypto'
import { placeholder } from '../../packages/cli/install-native.mjs'
import { hostTarget } from './stage-fixture.mjs'

const root = resolve(import.meta.dirname, '../..')
const binary = join(
  root,
  `research/go-cli/xplat-go-${hostTarget}-cli${process.platform === 'win32' ? '.exe' : ''}`,
)

const bytes = readFileSync(binary)
const version = JSON.parse(readFileSync(join(root, 'packages/cli/package.json'))).version
const target = `${process.platform}-${process.arch}`
const payloadName = `@octane-xplat/cli-native-${target}`
const hash = (value) => createHash('sha256').update(value).digest('hex')
function run(exe, args, options = {}) {
  const windowsManager = process.platform === 'win32' && ['npm', 'pnpm', 'bun'].includes(exe)

  return spawnSync(exe, windowsManager ? args.map((arg) => `"${arg}"`) : args, {
    encoding: 'utf8',
    timeout: 120000,
    ...(windowsManager ? { shell: true } : {}),
    ...options,
  })
}

function windowsCommand(command, args, options) {
  // cmd /s /c needs an outer quote pair around a quoted executable path.
  const line = `""${command}" ${args.map((arg) => `"${arg}"`).join(' ')}"`

  return run(process.env.ComSpec, ['/d', '/s', '/c', line], {
    ...options,
    windowsVerbatimArguments: true,
  })
}

function ok(result) {
  assert.ifError(result.error)
  assert.equal(result.status, 0, result.stdout + result.stderr)
  return result
}

function json(path, data) {
  writeFileSync(path, JSON.stringify(data, null, 2))
}

function fixture(work, name, dir, dependencies = {}) {
  const source = join(work, dir)

  mkdirSync(join(source, 'bin'), { recursive: true })
  cpSync(join(root, `packages/${dir}/install-native.mjs`), join(source, 'install-native.mjs'))
  writeFileSync(join(source, 'bin/xplat.exe'), placeholder, { mode: 0o755 })
  json(join(source, 'package.json'), {
    name,
    version,
    type: 'module',
    bin: { xplat: './bin/xplat.exe' },
    exports: { './package.json': './package.json' },
    scripts: {
      postinstall: 'node install-native.mjs',
      prepack: 'node install-native.mjs --prepare-package',
      postpack: 'node install-native.mjs',
    },
    dependencies,
    ...(dir === 'cli' ? { optionalDependencies: { [payloadName]: version } } : {}),
  })

  if (dir === 'cli') {
    json(join(source, 'native-platforms.json'), {
      version: 1,
      cliVersion: version,
      targets: { [target]: { package: payloadName, bytes: bytes.length, sha256: hash(bytes) } },
    })
  }

  return source
}

for (const manager of ['bun', 'npm', 'pnpm']) {
  test(`${manager}: packed direct and umbrella entries link before install, survive repacking, and run without Node`, (t) => {
    // The five-host executable CI lane installs all three managers explicitly.
    assert.equal(run(manager, ['--version']).status, 0, `Install ${manager} to run this gate`)

    const work = mkdtempSync(join(tmpdir(), 'xplat-native-entry-'))

    t.after(() => rmSync(work, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }))

    const payload = join(work, 'payload')

    mkdirSync(payload)
    json(join(payload, 'package.json'), {
      name: payloadName,
      version,
      exports: { './package.json': './package.json' },
    })

    writeFileSync(join(payload, 'xplat.exe'), bytes, { mode: 0o755 })

    const cli = fixture(work, '@octane-xplat/cli', 'cli')
    // Install a local payload for lifecycle tests, without any registry access.
    const payloadLink = join(cli, 'node_modules', payloadName)

    mkdirSync(resolve(payloadLink, '..'), { recursive: true })
    symlinkSync(payload, payloadLink, process.platform === 'win32' ? 'junction' : 'dir')

    const umbrella = fixture(work, 'octane-xplat', 'toolchain', {
      '@octane-xplat/cli': `file:${join(work, 'cli.tgz')}`,
    })

    mkdirSync(join(umbrella, 'node_modules/@octane-xplat'), { recursive: true })
    symlinkSync(
      cli,
      join(umbrella, 'node_modules/@octane-xplat/cli'),
      process.platform === 'win32' ? 'junction' : 'dir',
    )

    const archives = {}

    for (const [name, source] of [
      ['payload', payload],
      ['cli', cli],
      ['toolchain', umbrella],
    ]) {
      archives[name] = join(work, name + '.tgz')
      for (let iteration = 0; iteration < 2; iteration++) {
        if (name !== 'payload') {
          ok(run(process.execPath, [join(source, 'install-native.mjs')]))
          assert.equal(hash(readFileSync(join(source, 'bin/xplat.exe'))), hash(bytes))
        }

        ok(run('bun', ['pm', 'pack', '--filename', archives[name]], { cwd: source }))
        if (name !== 'payload') {
          assert.equal(
            ok(run('tar', ['-xOf', archives[name], 'package/bin/xplat.exe'])).stdout,
            placeholder,
          )

          assert.equal(
            hash(readFileSync(join(source, 'bin/xplat.exe'))),
            hash(bytes),
            'postpack restores the local executable',
          )
        }
      }
    }

    for (const direct of [true, false]) {
      const app = join(work, direct ? 'direct Ω' : 'umbrella Ω')

      mkdirSync(app)

      const name = direct ? '@octane-xplat/cli' : 'octane-xplat'

      json(join(app, 'package.json'), {
        private: true,
        dependencies: {
          [name]: `file:${direct ? archives.cli : archives.toolchain}`,
          [payloadName]: `file:${archives.payload}`,
        },
        overrides: { [payloadName]: `file:${archives.payload}` },
        trustedDependencies: ['octane-xplat', '@octane-xplat/cli'],
      })

      // Local tarball versions have file: identities rather than registry
      // semvers in pnpm. This closed fixture contains only our three packages.
      writeFileSync(
        join(app, 'pnpm-workspace.yaml'),
        `dangerouslyAllowAllBuilds: true\noverrides:\n  '${payloadName}': 'file:${archives.payload.replaceAll('\\', '/')}'\n`,
      )

      ok(run(manager, ['install', '--ignore-scripts'], { cwd: app }))

      const installed = join(app, 'node_modules', name)
      const command = join(
        app,
        'node_modules/.bin',
        process.platform === 'win32' ? 'xplat.cmd' : 'xplat',
      )

      // No shebang is present at linking time, including when scripts are blocked.
      assert.equal(readFileSync(join(installed, 'bin/xplat.exe'), 'utf8'), placeholder)

      const blocked =
        process.platform === 'win32'
          ? windowsCommand(command, ['--version'], { cwd: app })
          : run('/bin/sh', [command, '--version'], { cwd: app })

      assert.notEqual(blocked.status, 0, 'a blocked installer must not silently succeed')
      if (process.platform !== 'win32') {
        assert.match(blocked.stderr, /native executable is not installed/)
      }

      // Explicit repair works regardless of dependency hook order. Run twice.
      for (let iteration = 0; iteration < 2; iteration++) {
        ok(run(process.execPath, [join(installed, 'install-native.mjs')], { cwd: app }))
      }

      assert.equal(hash(readFileSync(join(installed, 'bin/xplat.exe'))), hash(bytes))
      assert.equal(
        ok(
          run(join(installed, 'bin/xplat.exe'), ['--version'], {
            env: { ...process.env, PATH: '' },
          }),
        ).stdout.trim(),
        version,
      )

      // pnpm's POSIX shim needs dirname; keep only basic shell tools on PATH.
      const tools = join(app, 'shell-tools')

      mkdirSync(tools)
      if (process.platform !== 'win32') {
        for (const tool of ['dirname', 'uname']) {
          symlinkSync(`/usr/bin/${tool}`, join(tools, tool))
        }
      }

      const env = { ...process.env, PATH: tools, NODE_PATH: '', NODE_OPTIONS: '' }

      assert.equal(run('node', ['--version'], { env }).error?.code, 'ENOENT')

      const invoke = (args) =>
        process.platform === 'win32'
          ? windowsCommand(command, args, { cwd: app, env })
          : run(command, args, { cwd: app, env })

      assert.equal(ok(invoke(['--version'])).stdout.trim(), version)
      assert.match(ok(invoke(['--help'])).stdout, /typecheck/)

      const args = ['not-a-command Ω', '--json']
      const expected = run(binary, args, { cwd: app, env })
      const actual = invoke(args)

      assert.equal(actual.status, expected.status)
      assert.notEqual(actual.status, 0)
      assert.match(actual.stdout + actual.stderr, /not-a-command Ω/)
      // A real reinstall/rebuild runs the hook on existing command links.
      ok(run(manager, manager === 'bun' ? ['install', '--force'] : ['rebuild', name], { cwd: app }))
      assert.equal(ok(invoke(['--version'])).stdout.trim(), version)
      rmSync(join(app, 'node_modules'), { recursive: true, force: true })
      ok(run(manager, ['install'], { cwd: app }))
      assert.equal(ok(invoke(['--version'])).stdout.trim(), version)
      assert.equal(hash(readFileSync(join(installed, 'bin/xplat.exe'))), hash(bytes))
    }
  })
}
