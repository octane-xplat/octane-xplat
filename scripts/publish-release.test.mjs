import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { publishRelease } from './publish-release.ts'

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'xplat-release-test-'))

  t.after(() => rmSync(root, { recursive: true, force: true }))
  for (const name of ['a', 'b', 'cli', 'tsrx-typegen']) {
    mkdirSync(join(root, 'packages', name), { recursive: true })
    writeFileSync(
      join(root, 'packages', name, 'package.json'),
      JSON.stringify({ name: name === 'cli' ? '@octane-xplat/cli' : name, version: '1.0.0' }),
    )
  }

  return root
}

function registry(code = 'E404') {
  return { status: 1, stdout: JSON.stringify({ error: { code } }), stderr: '' }
}

const nativeDir = 'research/go-cli'
const staged = ({ outputDir }) => ({
  cli: { archive: join(outputDir, 'cli.tgz') },
  payloads: [
    '@octane-xplat/cli-native-darwin-arm64',
    '@octane-xplat/cli-native-darwin-x64',
    '@octane-xplat/cli-native-linux-x64',
    '@octane-xplat/cli-native-linux-arm64',
    '@octane-xplat/cli-native-win32-x64',
  ].map((name) => ({
    manifest: { name },
    archive: join(outputDir, name.split('-').pop() + '.tgz'),
  })),
})

test('packs all pending packages before npm publication and skips existing versions', (t) => {
  const root = fixture(t)
  const calls = []
  const run = (command, args, options) => {
    calls.push([command, ...args])
    if (args[0] === 'view') {
      return registry()
    }

    if (command === 'bun') {
      writeFileSync(join(args.at(-1), `${options.cwd.split('/').at(-1)}.tgz`), '')
    }

    return { status: 0, stdout: '', stderr: '' }
  }

  assert.deepEqual(publishRelease({ root, tag: 'nightly', nativeDir, stager: staged, run }), [
    '@octane-xplat/cli-native-darwin-arm64@1.0.0',
    '@octane-xplat/cli-native-darwin-x64@1.0.0',
    '@octane-xplat/cli-native-linux-x64@1.0.0',
    '@octane-xplat/cli-native-linux-arm64@1.0.0',
    '@octane-xplat/cli-native-win32-x64@1.0.0',
    '@octane-xplat/cli@1.0.0',
    'a@1.0.0',
    'b@1.0.0',
  ])

  const published = calls.filter((c) => c[1] === 'publish').map((c) => c[2])

  assert.equal(published.length, 8)
  // Payloads first, then the CLI, then everything else.
  assert.ok(published.slice(0, 5).every((path) => /x64|arm64|win32|linux|darwin/.test(path)))
  assert.match(published[5], /cli\.tgz$/)
  for (const call of calls.filter((c) => c[1] === 'publish')) {
    assert.deepEqual(call.slice(3), ['--access', 'public', '--provenance', '--tag', 'nightly'])
  }

  const skipped = []

  assert.deepEqual(
    publishRelease({
      root,
      nativeDir,
      stager: staged,
      run: (command, args) => {
        skipped.push(args)
        return { status: 0, stdout: '"1.0.0"' }
      },
    }),
    [],
  )

  assert.equal(skipped.length, 3)
})

test('the lockstep set requires --native-dir; independent tracks do not', (t) => {
  const root = fixture(t)

  assert.throws(() => publishRelease({ root, run: () => registry() }), /--native-dir/)

  const calls = []

  publishRelease({
    root,
    packageName: 'tsrx-typegen',
    run: (command, args) => {
      calls.push(args)
      return { status: 0, stdout: '"1.0.0"' }
    },
  })

  assert.deepEqual(calls, [['view', 'tsrx-typegen@1.0.0', 'version', '--json']])
})

test('already-published payloads are skipped while the CLI still stages', (t) => {
  const root = fixture(t)
  const seen = []
  const published = publishRelease({
    root,
    nativeDir,
    stager: staged,
    run: (command, args, options) => {
      seen.push(args)
      if (args[0] === 'view' && /cli-native-(darwin-arm64|win32-x64)/.test(args[1])) {
        return { status: 0, stdout: '"1.0.0"' }
      }

      if (args[0] === 'view') {
        return registry()
      }

      if (command === 'bun') {
        writeFileSync(join(args.at(-1), `${options.cwd.split('/').at(-1)}.tgz`), '')
      }

      return { status: 0, stdout: '', stderr: '' }
    },
  })

  assert.ok(!published.includes('@octane-xplat/cli-native-darwin-arm64@1.0.0'))
  assert.ok(!published.includes('@octane-xplat/cli-native-win32-x64@1.0.0'))
  assert.equal(published.filter((name) => name.startsWith('@octane-xplat/cli-native')).length, 3)
  assert.deepEqual(published[3], '@octane-xplat/cli@1.0.0')
})

test('registry/auth failures and pack failures stop before publication', (t) => {
  const root = fixture(t)

  assert.throws(
    () => publishRelease({ root, nativeDir, run: () => registry('E401') }),
    /Registry lookup failed/,
  )

  const calls = []

  assert.throws(
    () =>
      publishRelease({
        root,
        nativeDir,
        stager: staged,
        run: (command, _args) => {
          calls.push(command)
          return command === 'npm' ? registry() : { status: 1, stderr: 'broken' }
        },
      }),
    /Bun pack failed|cli-native/,
  )

  assert.ok(calls.length >= 1)
})

test('unknown package names fail', (t) => {
  const root = fixture(t)

  assert.throws(() => publishRelease({ root, packageName: 'missing' }), /No publishable package/)
})
