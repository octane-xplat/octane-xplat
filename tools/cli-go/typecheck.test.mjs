import assert from 'node:assert/strict'
import { test, after } from 'node:test'
import { spawn, spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  existsSync,
  symlinkSync,
  realpathSync,
  readdirSync,
} from 'node:fs'

import { join, resolve, dirname } from 'node:path'
import { homedir } from 'node:os'
import { setTimeout as delay } from 'node:timers/promises'
import { projectToolFixture } from './project-fixtures.mjs'

const root = resolve(import.meta.dirname, '../..'),
  work = join(root, 'research/go-cli')

const host = `${process.platform === 'win32' ? 'windows' : process.platform}-${process.arch === 'x64' ? 'amd64' : process.arch}`
const binary =
  process.env.XPLAT_GO_ROUTES_BINARY ??
  join(work, `xplat-go-${host}-cli${process.platform === 'win32' ? '.exe' : ''}`)

const build = JSON.parse(readFileSync(binary + '.json'))
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex')
assert.equal(sha(readFileSync(binary)), build.sha256)
for (const [file, hash] of Object.entries(build.inputs)) {
  assert.equal(sha(readFileSync(join(root, file))), hash, `Stale typecheck source: ${file}`)
}

const base = join(homedir(), 'agent-scratch/octane-xplat/go-cli-stoic-forge')
mkdirSync(base, { recursive: true })
const scratch = realpathSync(mkdtempSync(join(base, 'typecheck-')))
after(() => rmSync(scratch, { recursive: true, force: true }))
const tools = projectToolFixture(root, work, scratch, { checker: true, vite: false })
assert.equal(
  existsSync(join(tools.nodeModules, 'vite')),
  false,
  'Typecheck must not implicitly install Vite',
)

assert.equal(
  readdirSync(join(tools.nodeModules, '.bun')).some((name) => name.startsWith('vite@')),
  false,
)

let next = 0
function put(directory, file, value) {
  const path = join(directory, file)
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, typeof value === 'string' ? value : JSON.stringify(value))
  return path
}

function project(files = {}, { worker = true, checker = 'fake', body } = {}) {
  const directory = join(scratch, `project ${next++} π`)
  put(directory, 'package.json', { name: 'typecheck-fixture', private: true, type: 'module' })
  const scope = join(directory, 'node_modules/@octane-xplat')
  mkdirSync(scope, { recursive: true })
  if (worker) {
    symlinkSync(
      realpathSync(join(tools.nodeModules, '@octane-xplat/cli')),
      join(scope, 'cli'),
      process.platform === 'win32' ? 'junction' : 'dir',
    )
  }
  if (checker === 'fake') {
    put(directory, 'node_modules/typescript/package.json', {
      name: 'typescript',
      type: 'module',
      bin: { tsc: './checker.js' },
    })

    put(
      directory,
      'node_modules/typescript/checker.js',
      body ??
        `import{appendFileSync}from'node:fs';appendFileSync('invocations.jsonl',JSON.stringify({argv:process.argv.slice(2),cwd:process.cwd(),nodePath:process.env.NODE_PATH,nodeOptions:process.env.NODE_OPTIONS})+'\\n');console.log('checker stdout π😀');console.error('checker stderr β');`,
    )
  } else if (checker === 'real') {
    const parent = join(directory, 'node_modules')
    mkdirSync(parent, { recursive: true })
    symlinkSync(
      realpathSync(join(tools.nodeModules, 'typescript')),
      join(parent, 'typescript'),
      process.platform === 'win32' ? 'junction' : 'dir',
    )
    // The checker resolves its own compiler from the installed toolchain.
  }
  for (const [file, value] of Object.entries(files)) {
    put(directory, file, value)
  }
  return directory
}

function cli(directory, args = [], options = {}) {
  const result = spawnSync(binary, ['typecheck', ...args], {
    cwd: directory,
    encoding: 'utf8',
    timeout: 60000,
    ...options,
  })
  assert.equal(result.error, undefined)
  assert.equal(result.signal, null, result.stderr)
  return result
}

function invocations(directory) {
  return readFileSync(join(directory, 'invocations.jsonl'), 'utf8')
    .trim()
    .split('\n')
    .map((line) => JSON.parse(line))
}

function reference(directory) {
  const request = put(scratch, `request-${next++}.json`, {
    protocol: 'octane-build-worker',
    version: 1,
    id: 'typecheck-reference',
    project: directory,
    operation: 'typecheck-config',
  })
  const output = request + '.result'
  const result = spawnSync(process.execPath, [tools.worker, request, output], {
    cwd: directory,
    encoding: 'utf8',
    timeout: 30000,
  })
  assert.equal(result.status, 0, result.stderr)
  const response = JSON.parse(readFileSync(output))
  assert.equal(response.ok, true, JSON.stringify(response))
  return response.data
}

test('typecheck help/schema and no-program success do not need Node or installed tools', () => {
  const directory = project({}, { worker: false, checker: false }),
    env = { ...process.env, PATH: '' }
  assert.equal(cli(directory, ['--help'], { env }).status, 0)
  assert.equal(JSON.parse(cli(directory, ['--schema'], { env }).stdout).data.status, 'implemented')
  const result = cli(directory, [], { env })
  assert.equal(result.status, 0, result.stderr)
  assert.match(result.stdout, /Typecheck clean/)
  assert.equal(cli(directory, ['--unknown']).status, 1)
})

test('the umbrella compiler wins over incidental hoists while an authored compiler wins over the umbrella', () => {
  const directory = project({ 'tsconfig.json': {} })
  put(directory, 'node_modules/octane-xplat/package.json', {
    name: 'octane-xplat',
    dependencies: { typescript: '7.1.0-beta' },
  })
  put(directory, 'node_modules/octane-xplat/node_modules/typescript/package.json', {
    name: 'typescript',
    type: 'module',
    bin: { tsc: './checker.js' },
  })
  put(
    directory,
    'node_modules/octane-xplat/node_modules/typescript/checker.js',
    "console.log('toolchain compiler selected')",
  )
  const inherited = cli(directory)
  assert.equal(inherited.status, 0, inherited.stderr)
  assert.match(inherited.stdout, /toolchain compiler selected/)
  put(directory, 'package.json', {
    name: 'typecheck-fixture',
    private: true,
    type: 'module',
    devDependencies: { typescript: '7.1.0-beta' },
  })
  const authored = cli(directory)
  assert.equal(authored.status, 0, authored.stderr)
  assert.match(authored.stdout, /checker stdout/)
  assert.doesNotMatch(authored.stdout, /toolchain compiler selected/)
})

test('plain and legacy programs run in order with project cwd/environment and independent diagnostic streams', () => {
  const directory = project({ 'tsconfig.json': {}, 'tsconfig.native.json': {} })
  const result = cli(directory, [], {
    env: { ...process.env, NODE_PATH: '/ignored/global-modules', NODE_OPTIONS: '' },
  })
  assert.equal(result.status, 0, result.stderr)
  const calls = invocations(directory)
  assert.deepEqual(
    calls.map((call) => call.argv),
    [
      ['--noEmit', '--runExternalCode', '-p', join(directory, 'tsconfig.json')],
      ['--noEmit', '--runExternalCode', '-p', join(directory, 'tsconfig.native.json')],
    ],
  )
  for (const call of calls) {
    assert.equal(call.cwd, directory)
    assert.equal(call.nodePath, '')
    assert.equal(call.nodeOptions, '')
  }
  assert.match(result.stdout, /checker stdout π😀/)
  assert.doesNotMatch(result.stdout, /checker stderr/)
  assert.match(result.stderr, /checker stderr β/)
  assert.doesNotMatch(result.stderr, /checker stdout/)
})

test('canonical JSONC environment expansion replaces the legacy program and includes packaged ambient declarations', () => {
  const directory = project({
    'tsconfig.json': {},
    'tsconfig.native.json': {},
    'src/index.ts': 'export {};',
    'src/main.native.ts': 'export {};',
    'tsconfig.envs.json': '// JSONC\n{"environments":{"native":{"include":["src/**/*.ts"],},},}',
  })
  const result = cli(directory)
  assert.equal(result.status, 0, result.stderr)
  const file = join(directory, 'node_modules/.cache/xplat-typecheck/all.json')
  const generated = readFileSync(file, 'utf8')
  const expected = reference(directory)
  assert.equal(readFileSync(file, 'utf8'), generated)
  assert.deepEqual(
    invocations(directory).map((call) => call.argv[3]),
    expected.configs,
  )
  const program = JSON.parse(generated)
  assert.equal(program.compilerOptions.jsxImportSource, '@octane-xplat/jsx')
  assert.ok(program.files.some((path) => /typecheck-globals[/\\]native\.d\.ts$/.test(path)))
  assert.ok(program.files.includes(join(directory, 'src/main.native.ts')))
  assert.equal(expected.configs.includes(join(directory, 'tsconfig.native.json')), false)
})

test('route preparation never bakes loaders and preserves existing baked data', () => {
  const directory = project({
    'tsconfig.json': {},
    'app/index.tsx': 'export const dataMode="baked"; export default()=>null;',
    'app/index.loader.ts': 'throw Error("typecheck must never execute a loader");',
    'routes.gen.data.ts': '// preserved baked data\n',
  })
  const result = cli(directory)
  assert.equal(result.status, 0, result.stderr)
  assert.equal(
    readFileSync(join(directory, 'routes.gen.data.ts'), 'utf8'),
    '// preserved baked data\n',
  )
  assert.ok(existsSync(join(directory, 'routes.gen.types.ts')))
  assert.equal(invocations(directory).length, 1)
})

test('invalid manifest and absent selected checker fail without invoking a global executable', () => {
  for (const config of [
    '{broken',
    '{"environments":{"unknown":{}}}',
    '{"environments":{"native":{"include":["missing/*.ts"]}}}',
  ]) {
    const directory = project({ 'tsconfig.envs.json': config })
    const result = cli(directory)
    assert.equal(result.status, 1)
    assert.equal(existsSync(join(directory, 'invocations.jsonl')), false)
  }
  const missing = project({ 'tsconfig.json': {} }, { checker: false })
  const result = cli(missing)
  assert.equal(result.status, 1)
  assert.match(result.stderr, /[Ii]nstall.*typescript tool/)
})

test('nonzero compiler exit retains diagnostics and prevents the next program and success message', () => {
  const directory = project(
    { 'tsconfig.json': {}, 'tsconfig.native.json': {} },
    {
      body: 'console.log("stdout before failure");console.error("compiler diagnostic");process.exit(7)',
    },
  )
  const result = cli(directory)
  assert.equal(result.status, 1)
  assert.match(result.stdout, /stdout before failure/)
  assert.match(result.stderr, /compiler diagnostic/)
  assert.match(result.stderr, /compiler exit 7/)
  assert.doesNotMatch(result.stdout, /Typecheck clean/)
  assert.equal((result.stdout.match(/Typechecking /g) ?? []).length, 1)
})

test('malformed, out-of-order and stale program plans never start the checker', () => {
  for (const mode of ['outside', 'reversed', 'null', 'stale']) {
    const directory = project({ 'tsconfig.json': {}, 'tsconfig.native.json': {} })
    rmSync(join(directory, 'node_modules/@octane-xplat/cli'))
    put(directory, 'node_modules/@octane-xplat/cli/package.json', {
      name: '@octane-xplat/cli',
      type: 'module',
      exports: { './worker': './worker.js' },
    })

    const configs = [join(directory, 'tsconfig.json'), join(directory, 'tsconfig.native.json')]
    if (mode === 'outside') {
      configs[0] = join(directory, 'user-owned.json')
    }

    if (mode === 'reversed') {
      configs.reverse()
    }

    put(
      directory,
      'node_modules/@octane-xplat/cli/worker.js',
      `import fs from 'node:fs';const r=JSON.parse(fs.readFileSync(process.argv[2]));${mode === 'stale' ? "fs.appendFileSync('tsconfig.json','\\n');" : ''}fs.writeFileSync(process.argv[3],JSON.stringify({protocol:r.protocol,version:r.version,id:r.id,ok:true,data:{version:1,configs:${JSON.stringify(mode === 'null' ? null : configs)}}}));`,
    )

    const result = cli(directory)
    assert.equal(result.status, 1, result.stdout + result.stderr)
    assert.match(result.stderr, /invalid typecheck program plan|configuration changed/)
    assert.equal(existsSync(join(directory, 'invocations.jsonl')), false)
  }
})

test('the actual installed TypeScript checker accepts valid TypeScript and reports a real type error', () => {
  const directory = project(
    {
      'tsconfig.json': {
        compilerOptions: {
          target: 'ES2022',
          module: 'NodeNext',
          moduleResolution: 'NodeNext',
          skipLibCheck: true,
          types: [],
        },
        files: ['main.ts'],
      },
      'main.ts': 'export const value: string = "valid";',
    },
    { checker: 'real' },
  )
  const valid = cli(directory)
  assert.equal(valid.status, 0, valid.stdout + valid.stderr)
  assert.match(valid.stdout, /Typecheck clean/)
  put(directory, 'main.ts', 'export const value: string = 42;')
  const invalid = cli(directory)
  assert.equal(invalid.status, 1)
  assert.match(invalid.stdout + invalid.stderr, /not assignable|TS2322/)
  assert.doesNotMatch(invalid.stdout, /Typecheck clean/)
})

test(
  'public SIGTERM cancels an active compiler and resistant descendant after streamed diagnostics',
  { skip: process.platform === 'win32' },
  async () => {
    const directory = project(
      { 'tsconfig.json': {} },
      {
        body: `import{spawn}from'node:child_process';import{writeFileSync}from'node:fs';process.on('SIGTERM',()=>{});const child=spawn(process.execPath,['-e','process.on("SIGTERM",()=>{});console.log("ready");setTimeout(()=>process.exit(9),30000)'],{stdio:['ignore','pipe','ignore']});await new Promise(r=>child.stdout.once('data',r));child.stdout.resume();writeFileSync('armed.json',JSON.stringify({pid:process.pid,child:child.pid}));console.log('compiler stdout live');console.error('compiler stderr live');setTimeout(()=>process.exit(9),30000);await new Promise(()=>{});`,
      },
    )
    const runner = spawn(binary, ['typecheck'], { cwd: directory })
    let stdout = '',
      stderr = ''
    runner.stdout.on('data', (data) => (stdout += data))
    runner.stderr.on('data', (data) => (stderr += data))
    const exited = new Promise((resolve, reject) => {
      runner.once('error', reject)
      runner.once('close', (code, signal) => resolve({ code, signal }))
    })
    try {
      const start = Date.now()
      while (
        (!existsSync(join(directory, 'armed.json')) ||
          !stdout.includes('compiler stdout live') ||
          !stderr.includes('compiler stderr live')) &&
        Date.now() - start < 15000
      ) {
        await delay(30)
      }

      assert.ok(stdout.includes('compiler stdout live'), stdout + stderr)
      assert.ok(stderr.includes('compiler stderr live'), stdout + stderr)
      const armed = JSON.parse(readFileSync(join(directory, 'armed.json')))
      runner.kill('SIGTERM')
      assert.deepEqual(await exited, { code: 143, signal: null })
      for (const pid of [armed.pid, armed.child]) {
        assert.throws(() => process.kill(pid, 0), { code: 'ESRCH' })
      }

      assert.doesNotMatch(stdout, /Typecheck clean/)
    } finally {
      if (runner.exitCode === null && runner.signalCode === null) {
        runner.kill('SIGTERM')
      }

      await exited
    }
  },
)
