// Public native orchestration; the independently invoked project worker is the
// canonical renderer reference. Portable fixtures never execute the old CLI.
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
  readdirSync,
  realpathSync,
  statSync,
  chmodSync,
  symlinkSync,
  lstatSync,
  cpSync,
} from 'node:fs'

import { join, resolve, dirname, relative, sep } from 'node:path'
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
  assert.equal(sha(readFileSync(join(root, file))), hash, `Stale route source: ${file}`)
}

const base = join(homedir(), 'agent-scratch/octane-xplat/go-cli-stoic-forge')
mkdirSync(base, { recursive: true })
writeFileSync(
  join(base, 'README.md'),
  'Everything in this folder is disposable.\nOwner: Go CLI migration, stoic-forge/tools/cli-go. Retained evidence: research/go-cli and ~/dev/reports/octane-xplat.\n',
)

const scratch = realpathSync(mkdtempSync(join(base, 'routes-')))
after(() => rmSync(scratch, { recursive: true, force: true }))
function put(project, file, value) {
  const path = join(project, file)
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, typeof value === 'string' ? value : JSON.stringify(value))
  return path
}

const { nodeModules, worker } = projectToolFixture(root, work, scratch)
let next = 0
const screen = 'export default () => null;\n'
function project(files = {}, tools = true) {
  const directory = join(scratch, `project ${next++} π`)
  put(directory, 'package.json', { name: 'route-fixture', private: true, type: 'module' })
  if (tools) {
    symlinkSync(
      nodeModules,
      join(directory, 'node_modules'),
      process.platform === 'win32' ? 'junction' : 'dir',
    )
  }
  for (const [file, value] of Object.entries(files)) {
    put(directory, file, value)
  }
  return directory
}

function cli(directory, args = [], options = {}) {
  const result = spawnSync(binary, ['routes', ...args], {
    cwd: directory,
    encoding: 'utf8',
    timeout: 30000,
    ...options,
  })
  assert.equal(result.error, undefined)
  assert.equal(result.signal, null, result.stderr)
  return result
}

function launch(directory, args = []) {
  const watchFixture =
    process.platform === 'win32' && args.some((arg) => ['-w', '--watch'].includes(arg))
  const stop = join(scratch, `stop-${next++}`)
  const child = watchFixture
    ? spawn(join(work, `go-tests-${host}.exe`), ['-test.run=^TestRouteWatchFixture$', '-test.v'], {
        cwd: directory,
        env: { ...process.env, XPLAT_GO_ROUTE_FIXTURE: directory, XPLAT_GO_ROUTE_STOP: stop },
      })
    : spawn(binary, ['routes', ...args], { cwd: directory })
  let stdout = '',
    stderr = ''
  child.stdout.on('data', (data) => (stdout += data))
  child.stderr.on('data', (data) => (stderr += data))
  const exited = new Promise((resolve, reject) => {
    child.once('error', reject)
    child.once('close', (code, signal) => resolve({ code, signal }))
  })
  return {
    child,
    exited,
    output: () => stdout + stderr,
    stdout: () => stdout,
    async stop() {
      if (child.exitCode === null && child.signalCode === null) {
        if (watchFixture) {
          writeFileSync(stop, '')
        } else {
          child.kill('SIGTERM')
        }
      }
      return await exited
    },
  }
}

async function until(check, output = () => '', timeout = 15000) {
  const start = Date.now()
  while (Date.now() - start < timeout) {
    if (await check()) {
      return
    }

    await delay(50)
  }
  assert.fail(`Route fixture timed out: ${output()}`)
}

function snapshot(directory) {
  const result = {}
  function visit(path) {
    for (const entry of readdirSync(path, { withFileTypes: true })) {
      if (entry.name === 'node_modules') {
        continue
      }

      const file = join(path, entry.name)
      if (entry.isDirectory()) {
        visit(file)
      } else if (entry.name.includes('routes.gen.')) {
        result[relative(directory, file)] = readFileSync(file, 'utf8')
      }
    }
  }
  visit(directory)
  return result
}

function plan(directory, payload = {}) {
  const request = join(scratch, `request-${next++}.json`),
    result = request + '.result'
  writeFileSync(
    request,
    JSON.stringify({
      protocol: 'octane-build-worker',
      version: 1,
      id: 'reference',
      operation: 'route-plan',
      project: directory,
      bake: true,
      ...payload,
    }),
  )
  const child = spawnSync(process.execPath, [worker, request, result], {
    cwd: directory,
    encoding: 'utf8',
    timeout: 30000,
    env: { ...process.env, NODE_PATH: '', NODE_OPTIONS: '' },
  })
  assert.equal(child.status, 0, child.stderr)
  const response = JSON.parse(readFileSync(result))
  assert.equal(response.ok, true, JSON.stringify(response))
  return response.data
}

function assertPlan(directory, payload) {
  const reference = plan(directory, payload)
  assert.equal(reference.outputs.length, 18)
  for (const { file, source } of reference.outputs) {
    assert.equal(readFileSync(file, 'utf8'), source, file)
  }
  return reference
}

const posix = {
  skip:
    process.platform === 'win32'
      ? 'Node kill(SIGTERM) forcibly terminates Windows processes; graceful public console cancellation needs a console-control fixture'
      : false,
}

function alive(pid) {
  try {
    process.kill(pid, 0)
    return true
  } catch (error) {
    if (error.code === 'ESRCH') {
      return false
    }

    throw error
  }
}

test('native help/schema/aliases and missing-source diagnostics need no Node', () => {
  const empty = project({}, false),
    env = { ...process.env, PATH: '' }
  assert.equal(cli(empty, ['--help'], { env }).status, 0)
  const schema = cli(empty, ['--schema'], { env })
  assert.equal(schema.status, 0, schema.stderr)
  assert.equal(JSON.parse(schema.stdout).data.status, 'implemented')
  assert.match(cli(empty, [], { env }).stderr, /No route dir found/)
  for (const args of [['--unknown'], ['unexpected'], ['-dpages'], ['--dir']]) {
    assert.equal(cli(empty, args).status, 1)
  }
  const missingWorker = project({ 'app/index.tsx': screen }, false)
  assert.match(cli(missingWorker).stderr, /[Ii]nstall|worker/)
  const missingNode = project({ 'app/index.tsx': screen })
  assert.match(cli(missingNode, [], { env }).stderr, /Node is required/)
  for (const args of [
    ['--dir', 'pages', '--out', 'nested/routes.gen.ts'],
    ['-d', 'pages', '-o', 'nested/routes.gen.ts'],
    ['--dir=pages', '--out=nested/routes.gen.ts'],
  ]) {
    const selected = project({ 'pages/index.tsx': screen })
    const actual = cli(selected, args)
    assert.equal(actual.status, 0, actual.stderr)
    assertPlan(selected, { directory: 'pages', output: 'nested/routes.gen.ts' })
  }
})

test('all 18 route artifacts match canonical Node for loaders, Markdown, platform variants and reserved keys', () => {
  const directory = project({
    'app/index.tsx': screen,
    'app/data.tsx': 'export const dataMode = "baked"; ' + screen,
    'app/data.loader.ts':
      'export const loader=()=>({value:[1e-7,1e21,0],nested:JSON.parse(\'{"__proto__":{"safe":true}}\')});',
    'app/platform.tsx': screen,
    'app/platform.ios.tsx': screen,
    'app/guide.md': '# Guide\n\n**Hello**, [read more](https://example.com).\n',
    'app/__proto__.md': '# Reserved route\n',
    'app/constructor.md': '# Constructor\n',
  })
  const actual = cli(directory)
  assert.equal(actual.status, 0, actual.stderr)
  assertPlan(directory)
  assert.match(readFileSync(join(directory, 'routes.gen.data.ts'), 'utf8'), /__proto__/)
  const before = snapshot(directory),
    info = statSync(join(directory, 'routes.gen.contracts.ts'))
  assert.equal(cli(directory).status, 0)
  assert.deepEqual(snapshot(directory), before)
  assert.equal(statSync(join(directory, 'routes.gen.contracts.ts')).mtimeMs, info.mtimeMs)
  if (process.platform !== 'win32') {
    chmodSync(join(directory, 'routes.gen.contracts.ts'), 0o640)
    put(directory, 'app/another.tsx', screen)
    assert.equal(cli(directory).status, 0)
    assert.equal(statSync(join(directory, 'routes.gen.contracts.ts')).mode & 0o777, 0o640)
  }
})

test('a failed bake preserves the complete previous publication and reports diagnostics', () => {
  const directory = project({ 'app/index.tsx': screen })
  assert.equal(cli(directory).status, 0)
  const before = snapshot(directory)
  put(directory, 'app/baked.tsx', 'export const dataMode="baked"; ' + screen)
  for (const body of [
    'throw Error("intentional bake failure")',
    'return {unsupported:1n}',
    'return {negativeZero:-0}',
  ]) {
    put(
      directory,
      'app/baked.loader.ts',
      `export function loader(){console.log('bake stdout');console.error('bake stderr');${body}}`,
    )

    const actual = cli(directory)
    assert.equal(actual.status, 1, actual.stderr)
    assert.match(actual.stderr, /bake stdout/)
    assert.match(actual.stderr, /bake stderr/)
    assert.deepEqual(snapshot(directory), before)
  }
  put(directory, 'app/baked.loader.ts', 'export const loader=()=>({fixed:true})')
  assert.equal(cli(directory).status, 0)
  assertPlan(directory)
})

test('complete plan validation and stale source/output checks precede any publication', () => {
  for (const mode of [
    'outside',
    'duplicate',
    'incomplete',
    'null-count',
    'source-changed',
    'output-changed',
  ]) {
    const directory = project({ 'app/index.tsx': screen })
    assert.equal(cli(directory).status, 0)
    const before = snapshot(directory),
      data = plan(directory)

    if (mode === 'outside') {
      data.outputs[0].file = join(directory, 'user-owned.txt')
    }

    if (mode === 'duplicate') {
      data.outputs.push(data.outputs[0])
    }

    if (mode === 'incomplete') {
      data.outputs.pop()
    }

    if (mode === 'null-count') {
      data.count = null
    }

    // Replace the fixture's node_modules alias, never the installed dependency tree.
    rmSync(join(directory, 'node_modules'))
    put(directory, 'node_modules/@octane-xplat/cli/package.json', {
      name: '@octane-xplat/cli',
      type: 'module',
      exports: { './worker': './worker.js' },
    })

    put(
      directory,
      'node_modules/@octane-xplat/cli/worker.js',
      `import fs from 'node:fs';const r=JSON.parse(fs.readFileSync(process.argv[2]));${mode === 'source-changed' ? "fs.appendFileSync('app/index.tsx','\\n// concurrent input edit');" : ''}${mode === 'output-changed' ? "fs.writeFileSync('routes.gen.contracts.ts','user edit');" : ''}fs.writeFileSync(process.argv[3],JSON.stringify({protocol:r.protocol,version:r.version,id:r.id,ok:true,data:${JSON.stringify(data)}}));`,
    )

    const actual = cli(directory)
    assert.equal(actual.status, 1, actual.stderr)
    assert.match(actual.stderr, /destination|incomplete|count|changed during planning/i)
    if (mode === 'output-changed') {
      before['routes.gen.contracts.ts'] = 'user edit'
    }

    assert.deepEqual(snapshot(directory), before)
    assert.equal(existsSync(join(directory, 'user-owned.txt')), false)
    assert.equal(
      readdirSync(directory).some((name) => name.includes('.tmp-xplat-')),
      false,
    )
  }
})

test('authorized output directory aliases work without overwriting source references', () => {
  const directory = project({ 'app/index.tsx': screen })
  mkdirSync(join(directory, 'stored'))
  symlinkSync(
    join(directory, 'stored'),
    join(directory, 'generated'),
    process.platform === 'win32' ? 'junction' : 'dir',
  )
  const actual = cli(directory, ['--out', 'generated/routes.gen'])
  assert.equal(actual.status, 0, actual.stderr)
  assertPlan(directory, { output: 'generated/routes.gen' })
  assert.ok(lstatSync(join(directory, 'generated')).isSymbolicLink())
})

test(
  'SIGTERM waits for resistant worker/descendant cleanup and preserves prior outputs',
  posix,
  async () => {
    const directory = project({ 'app/index.tsx': screen })
    assert.equal(cli(directory).status, 0)
    const before = snapshot(directory)
    put(directory, 'app/baked.tsx', 'export const dataMode="baked"; ' + screen)
    put(
      directory,
      'app/baked.loader.mjs',
      `import{spawn}from'node:child_process';import{writeFileSync}from'node:fs';export async function loader(){process.on('SIGTERM',()=>{});const child=spawn(process.execPath,['-e','process.on("SIGTERM",()=>{});console.log("armed");setTimeout(()=>process.exit(9),30000)'],{stdio:['ignore','pipe','ignore']});await new Promise(r=>child.stdout.once('data',r));child.stdout.resume();writeFileSync('armed.json',JSON.stringify({pid:process.pid,child:child.pid,request:process.argv[2]}));setTimeout(()=>process.exit(9),30000);await new Promise(()=>{});}`,
    )
    const runner = launch(directory)
    try {
      await until(() => existsSync(join(directory, 'armed.json')), runner.output)
      const armed = JSON.parse(readFileSync(join(directory, 'armed.json')))
      assert.deepEqual(await runner.stop(), { code: 143, signal: null })
      assert.equal(alive(armed.pid), false)
      assert.equal(alive(armed.child), false)
      assert.equal(existsSync(dirname(armed.request)), false)
      assert.deepEqual(snapshot(directory), before)
    } finally {
      await runner.stop()
    }
  },
)

test('watch recovers configuration, ignores outputs, pins output path, and handles remove/recreate', async () => {
  const directory = project({ 'app/index.tsx': screen })
  const runner = launch(directory, ['--watch'])
  try {
    const generated = () => (runner.stdout().match(/Generated route contracts/g) ?? []).length
    await until(() => generated() === 1, runner.output)
    put(directory, 'routes.gen.contracts.ts', 'external generated edit')
    await delay(1200)
    assert.equal(generated(), 1)
    put(directory, 'xplat.routes.json', '{bad')
    await until(() => /routing config|invalid character|JSON/i.test(runner.output()), runner.output)
    put(directory, 'xplat.routes.json', { directory: 'app' })
    await until(() => generated() === 2, runner.output)
    put(directory, 'app/next.tsx', screen)
    await until(() => generated() === 3, runner.output)
    assertPlan(directory)
    put(directory, 'xplat.routes.json', { directory: 'app', out: 'moved/routes.gen' })
    await until(() => /watch-output-changed/.test(runner.output()), runner.output)
    assert.equal(existsSync(join(directory, 'moved')), false)
    put(directory, 'xplat.routes.json', { directory: 'app' })
    rmSync(join(directory, 'app'), { recursive: true })
    await until(() => /— 0 routes/.test(runner.stdout()), runner.output)
    put(directory, 'app/restored.tsx', screen)
    await until(
      () => readFileSync(join(directory, 'routes.gen.manifest.json'), 'utf8').includes('restored'),
      runner.output,
    )

    assertPlan(directory)
  } finally {
    assert.deepEqual(await runner.stop(), {
      code: process.platform === 'win32' ? 0 : 143,
      signal: null,
    })
  }
})

test('watch invalidation cancels slow baking before the latest source is published', async () => {
  const directory = project({
    'app/baked.tsx': 'export const dataMode="baked"; ' + screen,
    'app/baked.loader.mjs': `import{writeFileSync}from'node:fs';export async function loader(){process.on('SIGTERM',()=>{});writeFileSync('old.pid',String(process.pid));setTimeout(()=>process.exit(9),30000);await new Promise(()=>{});return {stale:true}}`,
  })
  const runner = launch(directory, ['-w'])
  try {
    await until(() => existsSync(join(directory, 'old.pid')), runner.output)
    const old = Number(readFileSync(join(directory, 'old.pid')))
    put(directory, 'app/baked.loader.mjs', 'export const loader=()=>({current:true})')
    await until(() => runner.stdout().includes('Generated route contracts'), runner.output)
    assert.equal(alive(old), false)
    assert.match(readFileSync(join(directory, 'routes.gen.data.ts'), 'utf8'), /current/)
    assert.doesNotMatch(readFileSync(join(directory, 'routes.gen.data.ts'), 'utf8'), /stale/)
    assertPlan(directory)
  } finally {
    await runner.stop()
  }
})

test(
  'copied real application route trees match the Node renderer',
  { skip: !existsSync(join(root, 'apps/web')) },
  () => {
    const tracked = spawnSync('git', ['ls-files', '-z', '**/xplat.routes.json'], {
      cwd: root,
      encoding: 'utf8',
    })
    assert.equal(tracked.status, 0, tracked.stderr)
    let checked = 0
    for (const file of tracked.stdout.split('\0').filter(Boolean)) {
      const original = dirname(join(root, file)),
        config = JSON.parse(readFileSync(join(root, file)))

      const fixture = project(),
        selected = join(fixture, dirname(file))

      for (let at = original; ; at = dirname(at)) {
        if (existsSync(join(at, 'package.json'))) {
          put(
            fixture,
            join(relative(root, at), 'package.json'),
            readFileSync(join(at, 'package.json'), 'utf8'),
          )
        }

        if (at === root) {
          break
        }

        assert.ok(at.startsWith(root + sep))
      }

      put(fixture, file, config)
      const routes =
        config.directory ?? ['app', 'src/app'].find((path) => existsSync(join(original, path)))

      if (routes && existsSync(join(original, routes))) {
        cpSync(join(original, routes), join(selected, routes), { recursive: true })
      }

      for (const ref of [...(config.manifests ?? []), config.context, config.transitions].filter(
        Boolean,
      )) {
        const source = ['', '.ts', '.tsx', '.tsrx', '.mts', '.js', '.mjs']
          .map((ext) => ({
            old: resolve(original, ref.module + ext),
            copy: resolve(selected, ref.module + ext),
          }))
          .find((path) => existsSync(path.old))

        assert.ok(
          source && source.old.startsWith(root + sep) && source.copy.startsWith(fixture + sep),
        )

        mkdirSync(dirname(source.copy), { recursive: true })
        cpSync(source.old, source.copy, { recursive: true })
      }

      const result = cli(selected)
      assert.equal(result.status, 0, `${file}: ${result.stderr}`)
      assertPlan(selected)
      checked++
    }
    assert.equal(checked, 7)
    console.info(
      `${checked} copied application route trees: all18 artifact bytes equal canonical Node`,
    )
  },
)
