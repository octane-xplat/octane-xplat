import { test, after } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync, spawnSync, spawn } from 'node:child_process'
import {
  mkdirSync,
  readFileSync,
  writeFileSync,
  rmSync,
  readdirSync,
  renameSync,
  existsSync,
  chmodSync,
} from 'node:fs'

import { join, resolve, dirname } from 'node:path'
import { ensureSnapshot } from '../../packages/cli/src/mcp/docs-snapshots.ts'
import { scratchRun } from './scratch.mjs'
import { nativeInputs } from './native-inputs.mjs'
import { setTimeout as delay } from 'node:timers/promises'

const root = resolve(import.meta.dirname, '../..')
const host = `${process.platform === 'win32' ? 'windows' : process.platform}-${process.arch === 'x64' ? 'amd64' : process.arch}`
const binary = join(
  root,
  `research/go-cli/xplat-go-${host}${process.platform === 'win32' ? '.exe' : ''}`,
)

assert.deepEqual(JSON.parse(readFileSync(binary + '.json')).inputs, nativeInputs(root))
const scratch = scratchRun(root, 'go-doc-snapshot')
after(() => rmSync(scratch, { recursive: true, force: true }))
const gitEnv = {
  ...process.env,
  GIT_AUTHOR_NAME: 'snapshot test',
  GIT_AUTHOR_EMAIL: 'test@example.invalid',
  GIT_COMMITTER_NAME: 'snapshot test',
  GIT_COMMITTER_EMAIL: 'test@example.invalid',
  GIT_CONFIG_NOSYSTEM: '1',
  GIT_CONFIG_GLOBAL: process.platform === 'win32' ? 'NUL' : '/dev/null',
}

const git = (args, cwd, input) =>
  execFileSync('git', args, { cwd, input, env: gitEnv, encoding: 'utf8' }).trim()

function put(path, data) {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, data)
  return path
}

function remote(name) {
  const repository = join(scratch, name)
  mkdirSync(repository, { recursive: true })
  git(['init', '-q'], repository)
  put(
    join(repository, 'packages/ui/package.json'),
    JSON.stringify({
      name: '@octane-xplat/ui',
      version: '1.0.0',
      scripts: { postinstall: 'exit 99' },
    }),
  )
  put(join(repository, 'docs/camera.md'), '# Camera\n\nUse capture() on web and ios.\n')
  put(join(repository, 'docs/raw.md'), Buffer.from([35, 32, 82, 97, 119, 10, 255]))
  put(
    join(repository, '.agents/design/camera.md'),
    '# Camera design\n\nSeparate development and release.\n',
  )
  put(join(repository, 'docs/private/secret.md'), '# Private\nNever copy.\n')
  put(join(repository, '.gitattributes'), 'docs/*.md filter=trap\n')
  git(['add', '-A'], repository)
  git(['commit', '-qm', 'first'], repository)
  git(['tag', '-a', 'v1.0.0', '-m', 'annotated release'], repository)
  return {
    cache: join(scratch, name + '-cache'),
    repository,
    package: '@octane-xplat/ui',
    version: '1.0.0',
  }
}

function requestFile(input) {
  return put(join(scratch, `request-${crypto.randomUUID()}.json`), JSON.stringify(input))
}

function native(input, env = {}) {
  const result = spawnSync(binary, ['doc-snapshot', '--request', requestFile(input)], {
    encoding: 'utf8',
    timeout: 15000,
    env: { ...process.env, ...env },
  })
  assert.equal(result.stderr, '')
  assert.equal(result.status, 0, result.stdout)
  return JSON.parse(result.stdout)
}

async function reference(input) {
  return ensureSnapshot(
    // Compare committed document data, independently of host checkout EOL
    // conversions or user-configured content filters.
    { cacheDir: input.cache + '-node', timeoutMs: 10000, env: gitEnv },
    {
      packageName: input.package,
      version: input.version,
      repo: input.repository,
      tag: 'v' + input.version,
      packageDir: 'packages/ui',
      acceptMovedTag: input.acceptMovedTag,
    },
  )
}

function contract(result) {
  const { dir: _dir, ...value } = result
  return value
}

function conflictContract(result) {
  // The reference omits source/tag inside conflict provenance. Preserve the
  // native release label while comparing the pin, remote and match semantics.
  const { source: _source, tag: _tag, ...provenance } = result.provenance
  return { ...result, provenance }
}

function noOperations(input) {
  assert.equal(
    readdirSync(join(input.cache, 'go-v1')).some((name) => name.startsWith('operation-')),
    false,
  )
}

test('exact annotated release binding and offline reuse match the independent Node reference', async () => {
  const input = remote('exact')
  const expected = await reference(input),
    actual = native(input)
  assert.deepEqual(contract(actual), contract(expected))
  assert.match(actual.dir, /go-v1/)
  assert.equal(
    readFileSync(join(actual.dir, 'docs/camera.md'), 'utf8'),
    readFileSync(join(expected.dir, 'docs/camera.md'), 'utf8'),
  )
  assert.equal(existsSync(join(actual.dir, '.git')), false)
  assert.equal(existsSync(join(actual.dir, '.gitattributes')), false)
  assert.equal(existsSync(join(actual.dir, 'docs/private/secret.md')), false)
  assert.deepEqual(contract(native(input, { PATH: '' })), {
    ...contract(actual),
    offline: true,
  })
  renameSync(input.repository, input.repository + '-offline')
  assert.deepEqual(contract(native(input)), contract(await reference(input)))
  noOperations(input)
})

test('moved/deleted tags hold the pin, and explicit acceptance validates new package metadata', async () => {
  const input = remote('moved')
  const first = native(input)
  await reference(input)
  put(join(input.repository, 'docs/camera.md'), '# Camera\n\nUse captureNext().\n')
  git(['add', '-A'], input.repository)
  git(['commit', '-qm', 'second'], input.repository)
  git(['tag', '-f', 'v1.0.0'], input.repository)
  const conflict = native(input)
  assert.deepEqual(conflictContract(conflict), conflictContract(await reference(input)))
  assert.equal(conflict.provenance.source, 'release-docs')
  assert.equal(conflict.provenance.tag, 'v1.0.0')
  assert.equal(conflict.cached.commit, first.commit)
  assert.equal(
    readFileSync(join(first.dir, 'docs/camera.md'), 'utf8').includes('captureNext'),
    false,
  )
  const accepted = { ...input, acceptMovedTag: true }
  const second = native(accepted)
  assert.deepEqual(contract(second), contract(await reference(accepted)))
  assert.equal(
    readFileSync(join(second.dir, 'docs/camera.md'), 'utf8').includes('captureNext'),
    true,
  )
  git(['tag', '-d', 'v1.0.0'], input.repository)
  assert.deepEqual(conflictContract(native(input)), conflictContract(await reference(input)))
  put(
    join(input.repository, 'packages/ui/package.json'),
    JSON.stringify({ name: '@octane-xplat/ui', version: '9.0.0' }),
  )
  git(['add', '-A'], input.repository)
  git(['commit', '-qm', 'wrong package version'], input.repository)
  git(['tag', 'v1.0.0'], input.repository)
  assert.equal(native(accepted).reason, 'metadata-mismatch')
  assert.equal(native(input).cached.commit, second.commit)
  noOperations(input)
})

test('cache corruption, missing pages and extra files never become verified offline docs', () => {
  for (const mutation of ['bytes', 'missing', 'extra', 'metadata']) {
    const input = remote('corrupt-' + mutation),
      first = native(input)

    assert.equal(first.status, 'bound', JSON.stringify(first))
    if (mutation === 'bytes') {
      put(join(first.dir, 'docs/raw.md'), Buffer.from([35, 32, 82, 97, 119, 10, 254]))
    }

    if (mutation === 'missing') {
      rmSync(join(first.dir, 'docs/camera.md'))
    }

    if (mutation === 'extra') {
      put(join(first.dir, 'docs/injected.md'), '# Unverified\n')
    }

    if (mutation === 'metadata') {
      const binding = join(
        input.cache,
        'go-v1/bindings',
        readdirSync(join(input.cache, 'go-v1/bindings')).find((name) => name.endsWith('.json')),
      )

      const record = JSON.parse(readFileSync(binding))
      record.repository = 'https://example.invalid/other'
      put(binding, JSON.stringify(record))
    }

    assert.equal(native(input, { PATH: '' }).reason, 'cache-invalid', mutation)
    assert.equal(native(input).reason, 'cache-invalid', mutation)
    noOperations(input)
  }
})

test(
  'Windows snapshots fetch long object paths without changing global Git configuration',
  { skip: process.platform !== 'win32' },
  () => {
    const input = remote('long-path'),
      base = join(scratch, 'long-cache')
    input.cache = join(base, 'x'.repeat(Math.max(1, 146 - base.length - 1)))
    const result = native(input)
    assert.equal(result.status, 'bound', JSON.stringify(result))
    assert.equal(
      readFileSync(join(result.dir, 'docs/camera.md'), 'utf8'),
      '# Camera\n\nUse capture() on web and ios.\n',
    )
    noOperations(input)
  },
)

test('ambient Git config cannot execute filters/hooks or change repository identity', () => {
  const input = remote('config'),
    marker = join(scratch, 'filter-ran')
  const hooks = join(scratch, 'hooks')
  mkdirSync(hooks)
  put(join(hooks, 'post-checkout'), `#!/bin/sh\ntouch '${marker}'\n`)
  const config = put(
    join(scratch, 'injected.gitconfig'),
    `[filter "trap"]\nsmudge = touch '${marker}'\nrequired = true\n[core]\nhooksPath = ${hooks}\n[url "https://invalid.invalid/"]\ninsteadOf = ${scratch}\n`,
  )
  const actual = native(input, {
    GIT_CONFIG_GLOBAL: config,
    GIT_CONFIG_COUNT: '1',
    GIT_CONFIG_KEY_0: 'core.bare',
    GIT_CONFIG_VALUE_0: 'false',
  })
  assert.equal(actual.status, 'bound')
  assert.equal(existsSync(marker), false)
  const other = remote('other-repo')
  git(['tag', '-d', 'v1.0.0'], other.repository)
  assert.equal(native({ ...other, cache: input.cache }).reason, 'tag-absent')
  const linkObject = git(['hash-object', '-w', '--stdin'], input.repository, '/outside/secret.md')
  git(
    ['update-index', '--add', '--cacheinfo', `120000,${linkObject},docs/link.md`],
    input.repository,
  )
  git(['commit', '-qm', 'symlink'], input.repository)
  git(['tag', '-f', 'v1.0.0'], input.repository)
  const linked = native({ ...input, acceptMovedTag: true })
  assert.equal(existsSync(join(linked.dir, 'docs/link.md')), false)
  noOperations(input)
})

test('concurrent bindings serialize per identity without losing other packages', async () => {
  const input = remote('concurrent')
  put(
    join(input.repository, 'packages/media/package.json'),
    JSON.stringify({ name: '@octane-xplat/media', version: '1.0.0' }),
  )
  git(['add', '-A'], input.repository)
  git(['commit', '-qm', 'media'], input.repository)
  git(['tag', '-f', 'v1.0.0'], input.repository)
  const inputs = [input, input, { ...input, package: '@octane-xplat/media' }]
  const settled = await Promise.allSettled(
    inputs.map(
      (request) =>
        new Promise((resolveResult, reject) => {
          const child = spawn(binary, ['doc-snapshot', '--request', requestFile(request)], {
            env: process.env,
          })
          let stdout = '',
            stderr = ''
          child.stdout.on('data', (data) => (stdout += data))
          child.stderr.on('data', (data) => (stderr += data))
          child.on('error', reject)
          child.on('close', (code) => {
            try {
              assert.equal(code, 0, stdout + stderr)
              resolveResult(JSON.parse(stdout))
            } catch (error) {
              reject(error)
            }
          })
        }),
    ),
  )
  for (const result of settled) {
    if (result.status === 'rejected') {
      throw result.reason
    }
  }
  const results = settled.map((result) => result.value)
  assert.equal(
    results.every((result) => result.status === 'bound'),
    true,
  )
  assert.equal(results[0].commit, results[1].commit)
  assert.equal(
    readdirSync(join(input.cache, 'go-v1/bindings')).filter((name) => name.endsWith('.json'))
      .length,
    2,
  )
  noOperations(input)
})

test(
  'Git cancellation removes resistant inherited descendants before operation data',
  { skip: process.platform === 'win32' },
  async () => {
    const input = remote('cancel'),
      marker = join(scratch, 'git-pids.json'),
      bin = join(scratch, 'git-bin')
    const helper = put(
      join(scratch, 'git-helper.cjs'),
      `
const fs = require('node:fs'), { spawn } = require('node:child_process');
process.on('SIGTERM', () => {});
const child = spawn(process.execPath, ['-e', "process.on('SIGTERM',()=>{});console.log('ready');setInterval(()=>{},1000)"], {stdio:['ignore','pipe','inherit']});
child.stdout.once('data', () => fs.writeFileSync(${JSON.stringify(marker)}, JSON.stringify([process.pid, child.pid])));
setInterval(()=>{},1000);
`,
    )
    const fake = put(
      join(bin, 'git'),
      `#!/bin/sh\nexec '${process.execPath.replaceAll("'", "'\\''")}' '${helper.replaceAll("'", "'\\''")}' "$@"\n`,
    )
    chmodSync(fake, 0o700)
    const child = spawn(
      binary,
      ['doc-snapshot', '--timeout', '15s', '--request', requestFile(input)],
      { env: { ...process.env, PATH: bin + ':' + process.env.PATH } },
    )
    let stdout = '',
      stderr = ''
    child.stdout.on('data', (data) => (stdout += data))
    child.stderr.on('data', (data) => (stderr += data))
    const completed = new Promise((resolveExit, reject) => {
      child.once('error', reject)
      child.once('close', (code) => resolveExit(code))
    })
    try {
      const until = Date.now() + 5000
      while (!existsSync(marker) && Date.now() < until) {
        await delay(20)
      }

      assert.equal(existsSync(marker), true, 'waited for actual Git descendant readiness')
      const pids = JSON.parse(readFileSync(marker))
      child.kill('SIGTERM')
      assert.equal(await completed, 1, stdout + stderr)
      assert.match(stdout, /context canceled/)
      for (const pid of pids) {
        assert.throws(() => process.kill(pid, 0), { code: 'ESRCH' })
      }

      noOperations(input)
    } finally {
      if (child.exitCode === null) {
        child.kill('SIGTERM')
        await completed
      }
    }
  },
)

test('oversize release documents fail explicitly before snapshot publication', () => {
  const input = remote('oversize')
  put(join(input.repository, 'docs/large.md'), Buffer.alloc((4 << 20) + 1, 65))
  git(['add', '-A'], input.repository)
  git(['commit', '-qm', 'large page'], input.repository)
  git(['tag', '-f', 'v1.0.0'], input.repository)
  assert.equal(native(input).reason, 'snapshot-limit')
  assert.equal(existsSync(join(input.cache, 'go-v1/snapshots')), false)
  noOperations(input)
})
