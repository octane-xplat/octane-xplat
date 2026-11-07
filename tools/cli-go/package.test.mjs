import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  readdirSync,
  rmSync,
  realpathSync,
} from 'node:fs'

import { join, resolve } from 'node:path'
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
  const result = spawnSync(exe, args, { encoding: 'utf8', timeout: 60000, ...options })
  assert.ifError(result.error)
  assert.equal(result.status, 0, result.stdout + result.stderr)
  return result
}

test('production package installs a direct native bin through the optional host payload', (t) => {
  const scratch = realpathSync(scratchRun(root, 'go-npm-consumer'))
  t.after(() => rmSync(scratch, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }))
  const nativeDir = nativeFixture(root, binary)
  t.after(() => rmSync(nativeDir, { recursive: true, force: true }))
  const staged = stageRelease({
    root,
    version: JSON.parse(readFileSync(join(root, 'packages/cli/package.json'))).version,
    nativeDir,
    outputDir: join(scratch, 'stage'),
  })
  const { manifest: pkg, archive: tarball } = staged.cli
  const hostPayload = `@octane-xplat/cli-native-${process.platform}-${process.arch}`
  const payload = staged.payloads.find((item) => item.manifest.name === hostPayload)
  assert.ok(payload)
  // Workspace dependencies not yet on npm at this version resolve through
  // the same tarball override a consumer test would use.
  const depTarball = join(scratch, 'docs-search.tgz')
  run('bun', [
    'pm',
    'pack',
    '--ignore-scripts',
    '--filename',
    depTarball,
    join(root, 'packages/docs-search'),
  ])
  assert.equal(pkg.private, undefined)
  assert.equal(pkg.bin.xplat, './bin/xplat.exe')
  assert.equal(pkg.scripts.postinstall, 'node install-native.mjs')
  assert.equal(pkg.optionalDependencies[hostPayload], pkg.version)
  for (const { manifest } of staged.payloads) {
    assert.equal(manifest.private, undefined)
  }
  const inventory = run('tar', ['-tzf', tarball]).stdout.split(/\r?\n/).filter(Boolean)
  for (const name of [
    'package/bin/xplat.exe',
    'package/install-native.mjs',
    'package/native-platforms.json',
    'package/native-worker/manifest.json',
  ]) {
    assert.ok(inventory.includes(name), 'Packed CLI missing ' + name)
  }
  assert.ok(!inventory.includes('package/bin/xplat.mjs'))
  const consumer = join(scratch, 'consumer Ω')
  mkdirSync(consumer)
  writeFileSync(
    join(consumer, 'package.json'),
    JSON.stringify({
      private: true,
      dependencies: { '@octane-xplat/cli': `file:${tarball}` },
      overrides: {
        [hostPayload]: `file:${payload.archive}`,
        '@octane-xplat/docs-search': `file:${depTarball}`,
      },
      trustedDependencies: ['@octane-xplat/cli'],
    }),
  )
  // The published manifest carries real dependencies — resolve them from
  // the registry like a consumer install.
  run('bun', ['install', '--linker', 'isolated'], {
    cwd: consumer,
    env: { ...process.env, NODE_PATH: '' },
  })
  const installed = join(consumer, 'node_modules/@octane-xplat/cli')
  const native = join(installed, 'bin/xplat.exe')
  const image = JSON.parse(readFileSync(binary + '.json'))
  assert.equal(sha256(readFileSync(native)), image.sha256)
  assert.equal(
    run(native, ['--version'], { env: { ...process.env, PATH: '' } }).stdout.trim(),
    pkg.version,
  )
  assert.equal(
    run('bun', ['run', '--silent', 'xplat', '--version'], { cwd: consumer }).stdout.trim(),
    pkg.version,
  )
  const older = join(scratch, 'older project')
  mkdirSync(older)
  writeFileSync(
    join(older, 'package.json'),
    JSON.stringify({
      name: 'older',
      private: true,
      packageManager: 'bun@1.4.4',
      dependencies: { '@octane-xplat/ui': '0.18.0' },
      devDependencies: { '@octane-xplat/cli': '0.18.0' },
    }),
  )
  run(native, ['upgrade', '--no-install'], {
    cwd: older,
    env: { ...process.env, NODE_PATH: '', NODE_OPTIONS: '' },
  })
  assert.equal(
    JSON.parse(readFileSync(join(older, 'package.json'))).workspaces.catalogs.xplat[
      '@octane-xplat/cli'
    ],
    image.releaseWorker.frameworkVersion,
  )
  console.log('Production tarball: postinstall selected the host payload and ran the native bin')
})
