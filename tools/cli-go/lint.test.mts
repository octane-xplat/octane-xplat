import assert from 'node:assert/strict'
import { test, after } from 'node:test'
import { spawnSync, spawn } from 'node:child_process'
import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  realpathSync,
  symlinkSync,
  readdirSync,
} from 'node:fs'

import { join, resolve, dirname } from 'node:path'
import { homedir } from 'node:os'
import { createHash } from 'node:crypto'
import { once } from 'node:events'
import { projectToolFixture } from './project-fixtures.mjs'

const root = resolve(import.meta.dirname, '../..'),
  work = join(root, 'research/go-cli')

const host = `${process.platform === 'win32' ? 'windows' : process.platform}-${process.arch === 'x64' ? 'amd64' : process.arch}`
const binary = join(work, `xplat-go-${host}-cli${process.platform === 'win32' ? '.exe' : ''}`)
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex')
const build = JSON.parse(readFileSync(binary + '.json'))

assert.equal(sha(readFileSync(binary)), build.sha256)
for (const [file, hash] of Object.entries(build.inputs)) {
  assert.equal(sha(readFileSync(join(root, file))), hash, `Stale lint source: ${file}`)
}

const base = join(homedir(), 'agent-scratch/octane-xplat/go-cli-stoic-forge')

mkdirSync(base, { recursive: true })

const scratch = realpathSync(mkdtempSync(join(base, 'lint-')))

after(() => rmSync(scratch, { recursive: true, force: true }))

const tools = projectToolFixture(root, work, scratch, { vite: false, linter: true })

assert.equal(
  readdirSync(join(tools.nodeModules, '.bun')).some((name) => name.startsWith('vite@')),
  false,
)

let sequence = 0
function put(dir, file, value) {
  const path = join(dir, file)

  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, typeof value === 'string' ? value : JSON.stringify(value))
  return path
}

function project(files = {}, fake) {
  const dir = join(scratch, `project ${sequence++} π`)

  put(dir, 'package.json', { private: true, type: 'module' })
  for (const [file, value] of Object.entries(files)) {
    put(dir, file, value)
  }

  if (fake !== undefined) {
    put(dir, 'node_modules/@octane-xplat/lint/package.json', {
      name: '@octane-xplat/lint',
      exports: { './bin': './run.mjs' },
    })

    put(dir, 'node_modules/@octane-xplat/lint/run.mjs', fake)
  } else {
    symlinkSync(
      tools.nodeModules,
      join(dir, 'node_modules'),
      process.platform === 'win32' ? 'junction' : 'dir',
    )
  }

  return dir
}

function run(dir, args = [], native = true, env = {}) {
  const lint = join(dir, 'node_modules/@octane-xplat/lint/bin/lint.mjs')

  return spawnSync(
    native ? binary : process.execPath,
    native ? ['lint', ...args] : [lint, ...args],
    {
      cwd: dir,
      encoding: 'utf8',
      env: { ...process.env, NODE_OPTIONS: '', NODE_PATH: '', NO_COLOR: '1', ...env },
      timeout: 20000,
      maxBuffer: 8 << 20,
    },
  )
}

function status(result, expected) {
  assert.equal(result.status, expected, result.stdout + result.stderr)
}

test('lint help/schema are native; exact engine argv/env/exit and split output are preserved', () => {
  const dir = project(
    {},
    `console.log(JSON.stringify({argv:process.argv.slice(2),cwd:process.cwd(),options:process.env.NODE_OPTIONS,path:process.env.NODE_PATH}));console.error('lint π stderr');process.exitCode=23`,
  )

  for (const flag of ['--help', '--schema']) {
    const r = run(dir, [flag], true, { PATH: '' })

    status(r, 0)
    assert.match(r.stdout, /lint/)
  }

  const args = ['--fix', 'a path.ts', '--', '-literal.ts']
  const r = run(dir, args, true, { NODE_OPTIONS: '--no-warnings', NODE_PATH: '/not-a-project' })

  status(r, 23)
  assert.deepEqual(JSON.parse(r.stdout), { argv: args, cwd: dir, options: '', path: '' })
  assert.equal(r.stderr, 'lint π stderr\n')
})

test('actual installed engine agrees on valid/invalid regular and TSRX source', () => {
  for (const [code, files] of [
    [0, { 'a.ts': 'export const value = 1\n' }],
    [1, { 'a.ts': 'const = ;\n' }],
    [0, { 'a.tsrx': 'export const Example=()=> <></>\n' }],
    [1, { 'a.tsrx': 'export const Example=()=> <view/>\n' }],
    [1, { 'a.tsrx': 'const = ;\n' }],
  ]) {
    const dir = project(files)
    const expected = run(dir, [], false)
    const actual = run(dir)

    status(expected, code)
    assert.equal(actual.status, expected.status, actual.stdout + actual.stderr)
    assert.equal(actual.stderr, expected.stderr)
    assert.equal(
      /Found \d+ warnings/.test(actual.stdout),
      /Found \d+ warnings/.test(expected.stdout),
    )

    for (const [file, value] of Object.entries(files)) {
      assert.equal(readFileSync(join(dir, file), 'utf8'), value)
    }
  }
})

test('canonical configuration/ignore and setup failures retain engine semantics', () => {
  for (const files of [
    { 'a.ts': 'export const value=1\n', '.oxlintrc.json': '{broken' },
    { 'a.ts': 'const = ;\n', '.gitignore': 'a.ts\n' },
    { 'a.ts': 'const = ;\n', '.eslintignore': 'a.ts\n' },
    { 'a.ts': 'const = ;\n', '.oxlintrc.json': JSON.stringify({ ignorePatterns: ['a.ts'] }) },
  ]) {
    const dir = project(files)
    const expected = run(dir, [], false)
    const actual = run(dir)

    assert.equal(actual.status, expected.status, actual.stdout + actual.stderr)
    assert.equal(actual.stderr, expected.stderr)
  }
})

test('--fix uses the actual project engine; explicit delimiter and unknown flags remain engine-owned', () => {
  const source = 'export function value(a){if(a)return 1;return 0}\n'
  const a = project({ 'a.ts': source }),
    b = project({ 'a.ts': source })

  const expected = run(b, ['--fix', 'a.ts'], false),
    actual = run(a, ['--fix', 'a.ts'])

  assert.equal(actual.status, expected.status, actual.stdout + actual.stderr)
  assert.equal(readFileSync(join(a, 'a.ts'), 'utf8'), readFileSync(join(b, 'a.ts'), 'utf8'))
  assert.notEqual(readFileSync(join(a, 'a.ts'), 'utf8'), source)

  const dir = project({ '-literal.ts': 'export const value=1\n', '--schema': 'text' })

  status(run(dir, ['--', '-literal.ts']), 0)

  const flag = run(dir, ['--unknown', '--help'])

  status(flag, 2)
  assert.match(flag.stderr, /unknown option/)

  const literal = run(dir, ['--', '--schema'])

  status(literal, 2)
  assert.doesNotMatch(literal.stdout, /contractVersion/)
})

test('nearer broken/escaping/null exported runners never fall through or run another package', () => {
  const dir = project({}, 'throw Error("must not execute")')

  for (const entry of ['./missing.mjs', '../outside.mjs', 'run.ts', null]) {
    put(dir, 'node_modules/@octane-xplat/lint/package.json', {
      name: '@octane-xplat/lint',
      exports: { './bin': entry },
    })

    const r = run(dir)

    status(r, 2)
    assert.doesNotMatch(r.stderr, /must not execute/)
  }

  const missing = project({}, '')

  rmSync(join(missing, 'node_modules/@octane-xplat/lint'), { recursive: true })

  const r = run(missing)

  status(r, 2)
  assert.match(r.stderr, /bun add --dev @octane-xplat\/lint/)
})

test(
  'public SIGTERM cancels a live lint engine with streamed output',
  { skip: process.platform === 'win32' },
  async () => {
    const dir = project(
      {},
      `console.log('lint ready');console.error('live diagnostic');setInterval(()=>{},1000)`,
    )

    const child = spawn(binary, ['lint'], { cwd: dir, stdio: ['ignore', 'pipe', 'pipe'] })
    let output = '',
      errors = ''

    child.stdout.on('data', (bytes) => (output += bytes))
    child.stderr.on('data', (bytes) => (errors += bytes))

    const timer = setTimeout(() => child.kill('SIGKILL'), 5000)

    try {
      for (let i = 0; i < 100 && !output.includes('lint ready'); i++) {
        await new Promise((r) => setTimeout(r, 20))
      }

      assert.match(output, /lint ready/)
      child.kill('SIGTERM')
      assert.deepEqual(await once(child, 'close'), [143, null])
      assert.match(errors, /live diagnostic/)
    } finally {
      clearTimeout(timer)
    }
  },
)

test('actual copied repository source is checked by the packed installed engine', () => {
  const source = readFileSync(join(root, 'packages/cli/src/fmt-plan.ts'), 'utf8')
  const dir = project({ 'fmt-plan.ts': source })
  const expected = run(dir, [], false),
    actual = run(dir)

  status(expected, 0)
  status(actual, 0)
  assert.equal(actual.stderr, expected.stderr)
  assert.equal(readFileSync(join(dir, 'fmt-plan.ts'), 'utf8'), source)
})
