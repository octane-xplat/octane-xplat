import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdtempSync, realpathSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { devtoolsDesktopService } from '../src/devtools-worker.ts'

const project = realpathSync(process.cwd())

function request(overrides = {}) {
  return {
    protocol: 'octane-build-worker',
    version: 1,
    id: 'test-request',
    project,
    operation: 'devtools-desktop',
    target: 'macos',
    ...overrides,
  }
}

function servicePaths(directory) {
  return {
    serviceStateFile: join(directory, 'service.json'),
    resourceRoot: join(directory, 'resources'),
  }
}

async function rejects(req, requestFile, message) {
  await assert.rejects(() => devtoolsDesktopService(req, requestFile, '/tmp/result.json'), {
    message,
  })
}

test('devtools-desktop rejects a non-macOS target before touching service paths', async () => {
  const directory = realpathSync(mkdtempSync(join(tmpdir(), 'devtools-worker-')))
  const requestFile = join(directory, 'request.json')

  for (const target of ['web', 'ios', 'android', 'linux', 'windows', '']) {
    await rejects(
      request({ target, ...servicePaths(directory), profileRoot: '' }),
      requestFile,
      'Unsupported devtools target',
    )
  }
})

test('devtools-desktop requires native-owned service paths beside the request', async () => {
  const directory = realpathSync(mkdtempSync(join(tmpdir(), 'devtools-worker-')))
  const requestFile = join(directory, 'request.json')
  const good = servicePaths(directory)

  await rejects(
    request({ ...good, profileRoot: '', serviceStateFile: join(directory, 'other.json') }),
    requestFile,
    'Invalid native-owned service paths',
  )

  await rejects(
    request({ ...good, profileRoot: '', serviceStateFile: join(tmpdir(), 'service.json') }),
    requestFile,
    'Invalid native-owned service paths',
  )

  await rejects(
    request({ ...good, profileRoot: '', resourceRoot: join(directory, 'elsewhere') }),
    requestFile,
    'Invalid native-owned service paths',
  )
})

test('devtools-desktop requires an owned compiler profile inside the project', async () => {
  const directory = realpathSync(mkdtempSync(join(tmpdir(), 'devtools-worker-')))
  const requestFile = join(directory, 'request.json')
  const good = servicePaths(directory)

  const foreign = mkdtempSync(join(tmpdir(), '.xplat-go-profile-foreign'))

  await rejects(
    request({ ...good, profileRoot: realpathSync(foreign) }),
    requestFile,
    'Invalid native-owned compiler profile',
  )

  const wrongName = join(project, 'node_modules/.cache/.other-profile-test')

  mkdirSync(wrongName, { recursive: true })
  try {
    await rejects(
      request({ ...good, profileRoot: realpathSync(wrongName) }),
      requestFile,
      'Invalid native-owned compiler profile',
    )
  } finally {
    rmSync(wrongName, { recursive: true, force: true })
  }

  // A nonexistent profile path is also refused before the engine launches.
  await assert.rejects(() =>
    devtoolsDesktopService(
      request({ ...good, profileRoot: join(project, '.xplat-go-profile-missing') }),
      requestFile,
      '/tmp/result.json',
    ),
  )
})

test('devtoolsEntry resolves a direct devtools install', async () => {
  const { devtoolsEntry } = await import('../src/devtools-worker.ts')
  const dir = realpathSync(mkdtempSync(join(tmpdir(), 'devtools-entry-')))

  try {
    const pkg = join(dir, 'node_modules/@octane-xplat/devtools')

    mkdirSync(pkg, { recursive: true })
    writeFileSync(join(dir, 'package.json'), '{"name":"app","type":"module"}')
    writeFileSync(
      join(pkg, 'package.json'),
      JSON.stringify({
        name: '@octane-xplat/devtools',
        exports: { './desktop-node': './desktop-node.js', './package.json': './package.json' },
      }),
    )

    writeFileSync(join(pkg, 'desktop-node.js'), 'export {}\n')
    assert.equal(devtoolsEntry(dir), realpathSync(join(pkg, 'desktop-node.js')))
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('devtoolsEntry resolves devtools through the octane-xplat umbrella', async () => {
  const { devtoolsEntry } = await import('../src/devtools-worker.ts')
  const dir = realpathSync(mkdtempSync(join(tmpdir(), 'devtools-entry-')))

  try {
    const umbrella = join(dir, 'node_modules/octane-xplat')
    const pkg = join(umbrella, 'node_modules/@octane-xplat/devtools')

    mkdirSync(pkg, { recursive: true })
    writeFileSync(join(dir, 'package.json'), '{"name":"app","type":"module"}')
    writeFileSync(join(umbrella, 'package.json'), '{"name":"octane-xplat","type":"module"}')
    writeFileSync(
      join(pkg, 'package.json'),
      JSON.stringify({
        name: '@octane-xplat/devtools',
        exports: { './desktop-node': './desktop-node.js', './package.json': './package.json' },
      }),
    )

    writeFileSync(join(pkg, 'desktop-node.js'), 'export {}\n')
    assert.equal(devtoolsEntry(dir), realpathSync(join(pkg, 'desktop-node.js')))
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('devtoolsEntry skips an umbrella without the devtools dep and errors', async () => {
  const { devtoolsEntry } = await import('../src/devtools-worker.ts')
  const dir = realpathSync(mkdtempSync(join(tmpdir(), 'devtools-entry-')))

  try {
    mkdirSync(join(dir, 'node_modules/octane-xplat'), { recursive: true })
    writeFileSync(join(dir, 'package.json'), '{"name":"app","type":"module"}')
    writeFileSync(
      join(dir, 'node_modules/octane-xplat/package.json'),
      '{"name":"octane-xplat","type":"module"}',
    )

    assert.throws(() => devtoolsEntry(dir), /bun add -D octane-xplat/)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})
