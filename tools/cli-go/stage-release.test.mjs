import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import {
  cpSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
  realpathSync,
} from 'node:fs'

import { join, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { stageRelease, nativePlatformPackages } from './stage-release.mjs'
import { nativeFixture, hostTarget } from './stage-fixture.mjs'
import { scratchRun } from './scratch.mjs'

const root = resolve(import.meta.dirname, '../..')
const binary = join(
  root,
  `research/go-cli/xplat-go-${hostTarget}-cli${process.platform === 'win32' ? '.exe' : ''}`,
)

test('staged release carries the augmented CLI manifest and payload inventory', (t) => {
  const scratch = realpathSync(scratchRun(root, 'go-stage-release'))

  t.after(() => rmSync(scratch, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }))

  const nativeDir = nativeFixture(root, binary)

  t.after(() => rmSync(nativeDir, { recursive: true, force: true }))

  const version = JSON.parse(readFileSync(join(root, 'packages/cli/package.json'))).version
  const staged = stageRelease({ root, version, nativeDir, outputDir: join(scratch, 'stage') })
  const { manifest: pkg } = staged.cli

  assert.equal(pkg.name, '@octane-xplat/cli')
  assert.equal(pkg.version, version)
  assert.equal(pkg.bin.xplat, './bin/xplat.exe')
  assert.equal(pkg.scripts.postinstall, 'node install-native.mjs')
  assert.deepEqual(Object.keys(pkg.optionalDependencies).sort(), [...nativePlatformPackages].sort())
  for (const name of nativePlatformPackages) {
    assert.equal(pkg.optionalDependencies[name], version)
  }

  assert.equal(pkg.exports['./tsrx-mapper'], './bin/tsrx-mapper.mjs')
  assert.equal(pkg.exports['./package.json'], './package.json')
  assert.equal(staged.payloads.length, 5)

  const build = JSON.parse(readFileSync(binary + '.json'))
  const host = staged.platforms.targets[`${process.platform}-${process.arch}`]

  assert.equal(host.package, `@octane-xplat/cli-native-${process.platform}-${process.arch}`)
  assert.equal(host.sha256, build.sha256)
  assert.equal(host.bytes, build.bytes)
  for (const [target, record] of Object.entries(staged.platforms.targets)) {
    assert.equal(record.package, `@octane-xplat/cli-native-${target}`)
  }

  for (const { manifest } of staged.payloads) {
    assert.equal(manifest.version, version)
    assert.equal(manifest.repository.directory, 'packages/cli')
    assert.equal(manifest.private, undefined)
    assert.equal(manifest.files.includes('xplat.exe'), true)
  }
})

test('install-native exits 0 without a payload for an unsupported host', (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'xplat-install-'))

  t.after(() => rmSync(dir, { recursive: true, force: true }))
  cpSync(join(root, 'packages/cli/install-native.mjs'), join(dir, 'install-native.mjs'))
  writeFileSync(
    join(dir, 'package.json'),
    JSON.stringify({ name: '@octane-xplat/cli', version: '1.0.0' }),
  )

  writeFileSync(
    join(dir, 'native-platforms.json'),
    JSON.stringify({
      version: 1,
      cliVersion: '1.0.0',
      targets: {
        'unsupported-test': {
          package: '@octane-xplat/cli-native-unsupported-test',
          bytes: 1,
          sha256: '0'.repeat(64),
        },
      },
    }),
  )

  const result = spawnSync(process.execPath, [join(dir, 'install-native.mjs')], {
    encoding: 'utf8',
  })

  assert.equal(result.status, 0, result.stderr)
  assert.match(result.stderr, /no native executable for .*; supported: unsupported-test/)
})
