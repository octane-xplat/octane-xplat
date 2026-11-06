// Native orchestration against the real, minimally installed canonical worker.
import assert from 'node:assert/strict'
import { test, after } from 'node:test'
import { spawnSync, spawn } from 'node:child_process'
import { once } from 'node:events'
import { createRequire } from 'node:module'
import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  rmSync,
  existsSync,
  symlinkSync,
  realpathSync,
} from 'node:fs'

import { join, resolve, dirname } from 'node:path'
import { createHash } from 'node:crypto'
import { pathToFileURL } from 'node:url'
import { scratchRun } from './scratch.mjs'
import { projectToolFixture } from './project-fixtures.mjs'

const root = resolve(import.meta.dirname, '../..'),
  work = join(root, 'research/go-cli')

const host = `${process.platform === 'win32' ? 'windows' : process.platform}-${process.arch === 'x64' ? 'amd64' : process.arch}`
const binary = join(work, `xplat-go-${host}-cli${process.platform === 'win32' ? '.exe' : ''}`)
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex')
const build = JSON.parse(readFileSync(binary + '.json'))
assert.equal(sha(readFileSync(binary)), build.sha256)
for (const [file, hash] of Object.entries(build.inputs)) {
  assert.equal(sha(readFileSync(join(root, file))), hash, `Stale patch source: ${file}`)
}

const scratch = realpathSync(scratchRun(root, 'go-patches'))
after(() => rmSync(scratch, { recursive: true, force: true }))
const tools = projectToolFixture(root, work, scratch, { vite: false, packageManagement: true })
const assets = join(dirname(dirname(tools.worker)), 'patches')
const patch = readFileSync(join(assets, 'css@3.0.0.patch'))
const oracle = await import(pathToFileURL(join(dirname(tools.worker), 'patches.js')).href)
const env = {
  ...process.env,
  NODE_PATH: '',
  NODE_OPTIONS: '',
  HOME: join(scratch, 'home'),
  XDG_CACHE_HOME: join(scratch, 'cache'),
  LOCALAPPDATA: join(scratch, 'local-app-data'),
}

let sequence = 0
function put(dir, path, data) {
  const file = join(dir, path)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(
    file,
    typeof data === 'string' || Buffer.isBuffer(data) ? data : JSON.stringify(data),
  )
  return file
}

function fixture(
  manifest = { private: true, dependencies: { css: '3.0.0' } },
  files = {},
  worker = true,
) {
  const dir = join(scratch, `project ${sequence++} π`)
  put(dir, 'package.json', manifest)
  if (worker) {
    symlinkSync(
      tools.nodeModules,
      join(dir, 'node_modules'),
      process.platform === 'win32' ? 'junction' : 'dir',
    )
  }
  for (const [path, value] of Object.entries(files)) {
    put(dir, path, value)
  }
  return dir
}

function run(dir, args, overlay = {}) {
  return spawnSync(binary, ['patches', ...args], {
    cwd: dir,
    env: { ...env, ...overlay },
    encoding: 'utf8',
    timeout: 20000,
  })
}

function success(r) {
  assert.equal(r.status, 0, r.stdout + r.stderr)
  assert.equal(r.signal, null)
}

function manifest(dir) {
  return JSON.parse(readFileSync(join(dir, 'package.json')))
}

function copied(dir) {
  assert.deepEqual(readFileSync(join(dir, 'patches/css@3.0.0.patch')), patch)
}

test('group/child help and schemas are native and inputs fail before mutation', () => {
  const dir = fixture()
  for (const args of [
    ['--help'],
    ['--schema'],
    ['apply', '--help'],
    ['check', '--help'],
    ['apply', '--schema'],
    ['check', '--schema'],
  ]) {
    success(run(dir, args, { PATH: '' }))
  }
  const schema = JSON.parse(run(dir, ['apply', '--schema'], { PATH: '' }).stdout).data
  assert.equal(schema.status, 'implemented')
  assert.equal(
    schema.input.flags.find((flag) => flag.flag === 'package-manager').key,
    'packageManager',
  )
  for (const args of [
    [],
    ['unknown'],
    ['apply', '--bogus'],
    ['apply', '--package-manager', 'npm'],
  ]) {
    assert.notEqual(run(dir, args).status, 0)
  }
  assert.equal(existsSync(join(dir, 'patches')), false)
})

test('minimal installed CLI worker needs neither Vite nor compiler/parser dependencies', () => {
  const require = createRequire(tools.worker)
  for (const name of ['vite', '@babel/core', '@tsrx/core', '@octane-xplat/lib']) {
    assert.throws(() => require.resolve(name), { code: 'MODULE_NOT_FOUND' })
  }
  const dir = fixture()
  const missing = run(dir, ['check'])
  assert.equal(missing.status, 1)
  assert.match(missing.stdout, /no patchedDependencies entry/)
  success(run(dir, ['apply']))
  copied(dir)
  assert.equal(manifest(dir).patchedDependencies['css@3.0.0'], 'patches/css@3.0.0.patch')
  const before = readFileSync(join(dir, 'package.json'))
  success(run(dir, ['apply']))
  assert.deepEqual(readFileSync(join(dir, 'package.json')), before)
  success(run(dir, ['check']))
})

test('Bun and pnpm workspace writes agree with canonical Node selection and preserve comments', () => {
  for (const manager of ['bun', 'pnpm']) {
    const pkg = {
      private: true,
      packageManager: manager + '@1.0.0',
      workspaces: ['apps/*', '!apps/excluded'],
    }

    const yaml =
      '# authored heading\npackages: [apps/*, "!apps/excluded"]\ncatalogs:\n  pinned:\n    css: 3.0.0\n'

    const files = {
      'apps/one/package.json': {
        dependencies: { css: manager === 'pnpm' ? 'catalog:pinned' : '3.0.0' },
      },
      'apps/excluded/package.json': { dependencies: { css: '2.0.0' } },
      ...(manager === 'pnpm' ? { 'pnpm-workspace.yaml': yaml } : {}),
    }

    const dir = fixture(pkg, files),
      reference = fixture(pkg, files)

    const expected = oracle.applyPatches(join(reference, 'apps/one'), { packageManager: manager })
    assert.equal(
      expected.copied.some((row) => row.specifier === 'css@3.0.0'),
      true,
    )

    success(run(scratch, ['apply', '--dir', join(dir, 'apps/one'), '--package-manager', manager]))
    copied(dir)
    assert.equal(existsSync(join(dir, 'apps/one/patches')), false)
    for (const name of ['package.json', ...(manager === 'pnpm' ? ['pnpm-workspace.yaml'] : [])]) {
      assert.deepEqual(readFileSync(join(dir, name)), readFileSync(join(reference, name)))
    }

    if (manager === 'pnpm') {
      assert.match(readFileSync(join(dir, 'pnpm-workspace.yaml'), 'utf8'), /^# authored heading/)
    }

    success(run(dir, ['check']))
  }
})

test('conflicts preserve authored files; force changes only the canonical target; identical alternate mapping stays', () => {
  for (const alternate of [false, true]) {
    const dir = fixture(
      {
        private: true,
        dependencies: { css: '3.0.0' },
        patchedDependencies: alternate ? { 'css@3.0.0': 'authored/custom.patch' } : {},
      },
      { [alternate ? 'authored/custom.patch' : 'patches/css@3.0.0.patch']: 'custom patch' },
    )

    const conflict = run(dir, ['apply'])
    assert.equal(conflict.status, 1)
    assert.match(conflict.stdout, /conflicts above/)
    assert.equal(
      readFileSync(
        join(dir, alternate ? 'authored/custom.patch' : 'patches/css@3.0.0.patch'),
        'utf8',
      ),
      'custom patch',
    )

    success(run(dir, ['apply', '--force']))
    copied(dir)
    if (alternate) {
      assert.equal(readFileSync(join(dir, 'authored/custom.patch'), 'utf8'), 'custom patch')
    }
  }
  const dir = fixture(
    {
      dependencies: { css: '3.0.0' },
      patchedDependencies: { 'css@3.0.0': 'authored/custom.patch' },
    },
    { 'authored/custom.patch': patch },
  )
  success(run(dir, ['apply']))
  assert.equal(manifest(dir).patchedDependencies['css@3.0.0'], 'authored/custom.patch')
  assert.equal(existsSync(join(dir, 'patches')), false)
})

test('real Bun install consumes native-registered patch and repeats frozen lock without implicit install', () => {
  const dir = fixture({ private: true, dependencies: { css: '3.0.0' } }, {}, false)
  // Selected CLI can live at an ancestor; the install remains entirely disposable.
  const localModules = join(dir, 'node_modules')
  mkdirSync(join(localModules, '@octane-xplat'), { recursive: true })
  symlinkSync(
    realpathSync(join(tools.nodeModules, '@octane-xplat/cli')),
    join(localModules, '@octane-xplat/cli'),
    process.platform === 'win32' ? 'junction' : 'dir',
  )
  success(run(dir, ['apply']))
  assert.equal(existsSync(join(localModules, 'css')), false)
  function install(args) {
    const r = spawnSync('bun', args, { cwd: dir, encoding: 'utf8', timeout: 120000 })
    success(r)
  }
  install(['install', '--ignore-scripts'])
  // Bun may prune the fixture-only CLI link; restore it, without adding a package dependency.
  if (!existsSync(join(localModules, '@octane-xplat/cli'))) {
    mkdirSync(join(localModules, '@octane-xplat'), { recursive: true })
    symlinkSync(
      realpathSync(join(tools.nodeModules, '@octane-xplat/cli')),
      join(localModules, '@octane-xplat/cli'),
      process.platform === 'win32' ? 'junction' : 'dir',
    )
  }
  success(run(dir, ['check']))
  const css = createRequire(join(dir, 'package.json'))('css')
  assert.equal(
    css.parse('@layer reset { button { color: red } }').stylesheet.rules[0].type,
    'layer',
  )
  const lock = readFileSync(join(dir, 'bun.lock'))
  install(['install', '--frozen-lockfile', '--ignore-scripts'])
  assert.deepEqual(readFileSync(join(dir, 'bun.lock')), lock)
})

test('Bun JSONC and pnpm multi-document lock state retain meaningful canonical warnings', () => {
  for (const manager of ['bun', 'pnpm']) {
    const dir = fixture({
      private: true,
      packageManager: manager + '@1.0.0',
      dependencies: { css: '3.0.0' },
    })

    success(run(dir, ['apply']))
    const locks =
      manager === 'bun'
        ? [
            'bun.lock',
            '{ // JSONC\n"lockfileVersion":1,"packages":{"css":["css@3.0.0","",{}]},"patchedDependencies":{},}',
          ]
        : [
            'pnpm-lock.yaml',
            'lockfileVersion: 11.0\n---\npackages:\n  css@3.0.0: {}\npatchedDependencies: {}\n',
          ]

    put(dir, ...locks)
    const expected = oracle
      .inspectPatches(dir, { packageManager: manager })
      .find((row) => row.specifier === 'css@3.0.0')

    assert.equal(expected.state, 'not-installed')
    const r = run(dir, ['check'])
    assert.equal(r.status, 1)
    assert.match(r.stdout, /configured but missing/)
    assert.match(r.stdout, new RegExp('run `' + manager + ' install`'))
  }
})

test('linked patch ancestors/config/destinations are rejected before worker writes', () => {
  const outside = fixture({}, { keep: 'authored' }, false)
  const dir = fixture()
  symlinkSync(outside, join(dir, 'patches'), process.platform === 'win32' ? 'junction' : 'dir')
  const r = run(dir, ['apply'])
  assert.notEqual(r.status, 0)
  assert.equal(existsSync(join(outside, 'css@3.0.0.patch')), false)
  assert.equal(manifest(dir).patchedDependencies, undefined)
  if (process.platform !== 'win32') {
    for (const name of ['package.json', 'pnpm-workspace.yaml', 'patches/css@3.0.0.patch']) {
      const dir = fixture(),
        target = put(
          outside,
          'linked-' + sequence,
          name === 'package.json' ? { dependencies: { css: '3.0.0' } } : 'custom',
        )

      rmSync(join(dir, name), { force: true })
      mkdirSync(dirname(join(dir, name)), { recursive: true })
      symlinkSync(target, join(dir, name))
      const before = readFileSync(target)
      assert.notEqual(run(dir, ['apply', '--force']).status, 0)
      assert.deepEqual(readFileSync(target), before)
    }
  }
})

function fake(dir, body) {
  const file = put(dir, 'node_modules/@octane-xplat/cli/package.json', {
    name: '@octane-xplat/cli',
    type: 'module',
    exports: { './worker': './worker.mjs' },
  })
  put(
    dirname(file),
    'worker.mjs',
    `import {readFileSync,writeFileSync} from 'node:fs';import {spawn} from 'node:child_process';const [input,output]=process.argv.slice(2);const r=JSON.parse(readFileSync(input));const data={version:1,root:r.workspaceRoot,manager:r.expectedManager,rows:[]};${body};writeFileSync(output,JSON.stringify({protocol:r.protocol,version:r.version,id:r.id,ok:true,data}));`,
  )
}

test('required patch response roots reject omission, null and empty paths before mutation', () => {
  for (const body of ['delete data.root', 'data.root=null', "data.root=''"]) {
    const dir = fixture({}, {}, false)
    fake(
      dir,
      `if(r.operation==='patches-apply'){writeFileSync('mutation-ran','unexpected')};${body}`,
    )

    const before = readFileSync(join(dir, 'package.json'))
    for (const args of [['check'], ['apply']]) {
      const result = run(dir, args)
      assert.equal(result.status, 1)
      assert.match(result.stderr, /identity mismatch/)
      assert.equal(existsSync(join(dir, 'mutation-ran')), false)
      assert.deepEqual(readFileSync(join(dir, 'package.json')), before)
    }
  }
})

test('worker identity mismatch fails before writes; partial-effect errors remain explicit', () => {
  const bad = fixture({}, {}, false)
  fake(bad, `data.manager='npm'`)
  assert.match(run(bad, ['apply']).stderr, /identity mismatch/)
  const partial = fixture({}, {}, false)
  fake(
    partial,
    `if(r.operation==='patches-apply'){writeFileSync('partial-effect','written');throw Error('injected-after-write')}`,
  )
  const r = run(partial, ['apply'])
  assert.equal(r.status, 1)
  assert.match(r.stderr, /workspace files may have changed/)
  assert.equal(readFileSync(join(partial, 'partial-effect'), 'utf8'), 'written')
})

test('apply owns its lease through cancellation and cleans ordinary descendant workers', async (t) => {
  const dir = fixture({}, {}, false)
  put(dir, 'dist/previous-output', 'keep until lease is released')
  fake(
    dir,
    `if(r.operation==='patches-apply'){writeFileSync('partial-effect','written');const c=spawn(process.execPath,['-e',"process.on('SIGTERM',()=>{});setInterval(()=>{},1000)"],{stdio:'inherit'});writeFileSync('ready.json',JSON.stringify({pid:process.pid,child:c.pid}));process.on('SIGTERM',()=>{});await new Promise(()=>{})}`,
  )
  const child = spawn(binary, ['patches', 'apply'], {
      cwd: dir,
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
    }),
    exited = once(child, 'exit')
  let text = ''
  child.stdout.on('data', (b) => (text += b))
  child.stderr.on('data', (b) => (text += b))
  t.after(async () => {
    if (child.exitCode === null && child.signalCode === null) {
      child.kill('SIGTERM')
      await exited
    }
  })
  for (let i = 0; i < 200 && !existsSync(join(dir, 'ready.json')); i++) {
    await new Promise((r) => setTimeout(r, 25))
  }
  assert.ok(existsSync(join(dir, 'ready.json')), text)
  const busy = run(dir, ['apply'])
  assert.notEqual(busy.status, 0)
  assert.match(busy.stderr, /another Go project operation/)
  const clean = spawnSync(binary, ['clean'], { cwd: dir, env, encoding: 'utf8', timeout: 10000 })
  assert.notEqual(clean.status, 0)
  child.kill('SIGTERM')
  const [code] = await exited
  if (process.platform !== 'win32') {
    assert.equal(code, 1, text)
    assert.match(text, /workspace files may have changed/)
  }
  const pids = JSON.parse(readFileSync(join(dir, 'ready.json')))
  for (const pid of [pids.pid, pids.child]) {
    for (let i = 0; i < 100; i++) {
      try {
        process.kill(pid, 0)
      } catch {
        break
      }

      await new Promise((r) => setTimeout(r, 25))
    }

    assert.throws(() => process.kill(pid, 0), 'worker descendant survived')
  }
  // Replacing the fake engine verifies that cancellation released the lease.
  fake(dir, `data.report={copied:[],kept:[],skipped:[],conflicts:[]}`)
  success(run(dir, ['apply']))
})
