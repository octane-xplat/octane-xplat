import assert from 'node:assert/strict'
import { test, after } from 'node:test'
import { spawnSync, spawn } from 'node:child_process'
import { once } from 'node:events'
import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  readdirSync,
  rmSync,
  existsSync,
  symlinkSync,
  realpathSync,
} from 'node:fs'

import { join, resolve, dirname } from 'node:path'
import { createHash } from 'node:crypto'
import { scratchRun } from './scratch.mjs'

const root = resolve(import.meta.dirname, '../..'),
  work = join(root, 'research/go-cli')

const host = `${process.platform === 'win32' ? 'windows' : process.platform}-${process.arch === 'x64' ? 'amd64' : process.arch}`
const binary = join(work, `xplat-go-${host}-cli${process.platform === 'win32' ? '.exe' : ''}`)
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex')
const build = JSON.parse(readFileSync(binary + '.json'))

assert.equal(sha(readFileSync(binary)), build.sha256)
for (const [file, hash] of Object.entries(build.inputs)) {
  assert.equal(sha(readFileSync(join(root, file))), hash, `Stale clean source: ${file}`)
}

const scratch = realpathSync(scratchRun(root, 'go-clean'))

after(() => rmSync(scratch, { recursive: true, force: true }))

const env = {
  ...process.env,
  NODE_PATH: '',
  NODE_OPTIONS: '',
  HOME: join(scratch, 'home'),
  XDG_CACHE_HOME: join(scratch, 'os-cache'),
  LOCALAPPDATA: join(scratch, 'local-app-data'),
}

let sequence = 0
function put(dir, path, value) {
  const target = join(dir, path)

  mkdirSync(dirname(target), { recursive: true })
  writeFileSync(target, typeof value === 'string' ? value : JSON.stringify(value))
  return target
}

function fixture(manifest = {}, files = {}) {
  const dir = join(scratch, `app ${sequence++} π`)

  put(dir, 'package.json', manifest)
  for (const [path, value] of Object.entries(files)) {
    put(dir, path, value)
  }

  return dir
}

function run(dir, args = [], overlay = {}) {
  return spawnSync(binary, ['clean', ...args], {
    cwd: dir,
    env: { ...env, PATH: '', ...overlay },
    encoding: 'utf8',
    timeout: 15000,
  })
}

function success(result) {
  assert.equal(result.status, 0, result.stdout + result.stderr)
  assert.equal(result.signal, null)
}

function tree(dir) {
  const files = []
  function walk(path, prefix = '') {
    for (const entry of readdirSync(path, { withFileTypes: true })) {
      const name = prefix + entry.name,
        full = join(path, entry.name)

      if (entry.isDirectory()) {
        files.push([name + '/'])
        walk(full, name + '/')
      } else {
        files.push([name, readFileSync(full, 'utf8')])
      }
    }
  }

  walk(dir)
  return files.sort((a, b) => a[0].localeCompare(b[0]))
}

const outputs = Object.fromEntries(
  [
    'dist',
    'node_modules/.vite',
    'node_modules/.cache/xplat',
    '.ns-vite-build',
    'platforms/ios',
    'platforms/android',
    'platforms/windows',
    'platforms/tempPlugin',
  ].map((path) => [path + '/generated.txt', 'output']),
)

const authored = {
  'src/index.ts': 'authored source',
  'platforms/macos/host.swift': 'authored host',
  'node_modules/.cache/unrelated/keep': 'unrelated cache',
}

test('clean help/schema needs no Node and rejects unexpected inputs before deletion', () => {
  const dir = fixture({}, outputs)

  success(run(dir, ['--help']))

  const schema = run(dir, ['--schema'])

  success(schema)
  assert.equal(JSON.parse(schema.stdout).data.status, 'implemented')
  for (const args of [['--force'], ['dist']]) {
    const r = run(dir, args)

    assert.notEqual(r.status, 0)
    assert.ok(existsSync(join(dir, 'dist/generated.txt')))
  }
})

test('ordinary app/plugin cleanup removes only generated outputs', () => {
  for (const manifest of [
    {},
    { nativescript: { platforms: { ios: '9.1.0' } } },
    { nativescript: { platforms: [] } },
    { nativescript: { platforms: false } },
    { nativescript: { platforms: null } },
  ]) {
    const native = fixture(manifest, { ...outputs, ...authored })

    const r = run(native)

    success(r)
    for (const path of [
      'dist',
      '.ns-vite-build',
      'node_modules/.vite',
      'node_modules/.cache/xplat',
    ]) {
      assert.equal(existsSync(join(native, path)), false, path)
    }

    const plugin = manifest.nativescript?.platforms != null

    assert.equal(existsSync(join(native, 'platforms/ios')), plugin)

    assert.equal(readFileSync(join(native, 'platforms/macos/host.swift'), 'utf8'), 'authored host')

    const again = run(native)

    success(again)
    assert.match(again.stdout, /Nothing to clean/)
  }
})

test('strict invalid/non-object project metadata fails before any removal', () => {
  for (const text of [
    '// comment\n{}',
    '{"name":"app",}',
    '{"v":01}',
    '{} false',
    'null',
    '[]',
    'false',
    '',
  ]) {
    const dir = fixture({}, outputs)

    put(dir, 'package.json', text)

    const r = run(dir)

    assert.notEqual(r.status, 0, text)
    assert.ok(existsSync(join(dir, 'dist/generated.txt')))
    assert.ok(existsSync(join(dir, 'platforms/ios/generated.txt')))
  }

  const missing = fixture({}, outputs)

  rmSync(join(missing, 'package.json'))
  success(run(missing))
  assert.equal(existsSync(join(missing, 'dist')), false)
})

test('an OS cache override inside clean outputs fails before deletion', () => {
  const dir = fixture({}, outputs),
    cache = join(dir, 'dist/cache-profile')

  const r = run(dir, [], { HOME: cache, XDG_CACHE_HOME: cache, LOCALAPPDATA: cache })

  assert.notEqual(r.status, 0)
  assert.match(r.stderr, /project-lock cache must be outside/)
  assert.ok(existsSync(join(dir, 'dist/generated.txt')))
})

test('leaf directory aliases are unlinked without touching their target, including Windows junctions', () => {
  const outside = fixture({}, { 'keep.txt': 'authored outside output' })
  const dir = fixture({}, authored)

  symlinkSync(outside, join(dir, 'dist'), process.platform === 'win32' ? 'junction' : 'dir')
  success(run(dir))
  assert.equal(existsSync(join(dir, 'dist')), false)
  assert.equal(readFileSync(join(outside, 'keep.txt'), 'utf8'), 'authored outside output')
})

test('unsafe cache/platform ancestors reject the whole plan and preserve authored targets', () => {
  for (const ancestor of ['node_modules', '.cache', 'platforms']) {
    const dir = fixture({}, { 'dist/generated.txt': 'output' })
    const outside = fixture(
      {},
      {
        keep: 'authored',
        '.vite/keep': 'authored',
        '.cache/xplat/keep': 'authored',
        'xplat/keep': 'authored',
        'ios/keep': 'authored',
      },
    )

    const relative = ancestor === '.cache' ? 'node_modules/.cache' : ancestor

    mkdirSync(dirname(join(dir, relative)), { recursive: true })
    symlinkSync(outside, join(dir, relative), process.platform === 'win32' ? 'junction' : 'dir')

    const r = run(dir)

    assert.notEqual(r.status, 0, r.stdout + r.stderr)
    assert.ok(existsSync(join(dir, 'dist/generated.txt')))
    assert.equal(readFileSync(join(outside, 'keep'), 'utf8'), 'authored')
    assert.ok(existsSync(join(outside, 'ios/keep')))
  }

  const plugin = fixture({ nativescript: { platforms: {} } }, { 'dist/generated': 'output' })
  const outside = fixture({}, { 'ios/keep': 'authored' })

  symlinkSync(outside, join(plugin, 'platforms'), process.platform === 'win32' ? 'junction' : 'dir')
  success(run(plugin))
  assert.ok(existsSync(join(outside, 'ios/keep')))
})

test(
  'broken output links and case variants of authored macOS source have safe native behavior',
  { skip: process.platform === 'win32' },
  () => {
    const dir = fixture({}, { 'platforms/MACOS/keep.swift': 'authored' })

    symlinkSync(join(dir, 'missing'), join(dir, 'dist'), 'dir')
    success(run(dir))
    assert.equal(readdirSync(dir).includes('dist'), false)
    assert.equal(readFileSync(join(dir, 'platforms/MACOS/keep.swift'), 'utf8'), 'authored')
  },
)

test(
  'terminal confirmation accepts yes and preserves outputs on no, EOF or cancellation',
  { skip: process.platform === 'win32' },
  () => {
    for (const input of ['n', 'yes', 'EOF', 'SIGTERM']) {
      const dir = fixture({}, { 'dist/bundle': 'output' })
      const args = ['-I', join(root, 'tools/cli-go/clean-terminal.py'), binary, input]
      const r = spawnSync('python3', args, { cwd: dir, env, encoding: 'utf8', timeout: 12000 })

      success(r)

      const result = JSON.parse(r.stdout)

      assert.equal(result.promptObserved, true, result.output)
      assert.equal(result.code, input === 'SIGTERM' ? 143 : 0, result.output)
      assert.equal(existsSync(join(dir, 'dist')), input !== 'yes', result.output)
    }
  },
)

test('clean refuses an active native build, then succeeds after cancellation releases its kernel lease', async (t) => {
  const dir = fixture(
    { xplat: { targets: { web: { entry: 'index.js' } } } },
    { 'dist/previous': 'old build', 'vite.config.mjs': 'export default {}' },
  )

  put(dir, 'node_modules/vite/package.json', {
    name: 'vite',
    version: 'fixture',
    bin: { vite: 'run.mjs' },
  })

  put(
    dir,
    'node_modules/vite/run.mjs',
    `import {writeFileSync} from 'node:fs';writeFileSync('engine.json',JSON.stringify({pid:process.pid}));console.log('engine-ready');setInterval(()=>{},1000)`,
  )

  const child = spawn(binary, ['build', '--targets', 'web'], {
    cwd: dir,
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  const exited = once(child, 'exit')
  let text = ''

  child.stdout.on('data', (bytes) => (text += bytes))
  child.stderr.on('data', (bytes) => (text += bytes))
  t.after(async () => {
    if (child.exitCode === null && child.signalCode === null) {
      child.kill('SIGTERM')
      await exited
    }
  })

  for (let i = 0; i < 200 && !text.includes('engine-ready'); i++) {
    await new Promise((resolve) => setTimeout(resolve, 25))
  }

  assert.match(text, /engine-ready/)

  const alias = join(scratch, 'project alias')

  symlinkSync(dir, alias, process.platform === 'win32' ? 'junction' : 'dir')
  for (const location of [dir, alias]) {
    const busy = run(location)

    assert.notEqual(busy.status, 0)
    assert.match(busy.stderr, /another Go project operation/)
  }

  assert.equal(readFileSync(join(dir, 'dist/previous'), 'utf8'), 'old build')
  child.kill('SIGTERM')

  const [code] = await exited

  if (process.platform !== 'win32') {
    assert.equal(code, 143, text)
  }

  const pid = JSON.parse(readFileSync(join(dir, 'engine.json'))).pid

  for (let i = 0; i < 100; i++) {
    try {
      process.kill(pid, 0)
    } catch {
      break
    }

    await new Promise((resolve) => setTimeout(resolve, 25))
  }

  assert.throws(() => process.kill(pid, 0), 'engine process remained alive')
  success(run(dir))
  assert.equal(existsSync(join(dir, 'dist')), false)
})
