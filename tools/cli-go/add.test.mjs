import assert from 'node:assert/strict'
import { test, after } from 'node:test'
import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  rmSync,
  readdirSync,
  realpathSync,
  symlinkSync,
  existsSync,
} from 'node:fs'

import { join, dirname, resolve, relative } from 'node:path'
import { spawnSync, spawn } from 'node:child_process'
import { once } from 'node:events'
import { setTimeout as delay } from 'node:timers/promises'
import { createHash } from 'node:crypto'
import { pathToFileURL } from 'node:url'
import { scratchRun } from './scratch.mjs'
import { projectToolFixture } from './project-fixtures.mjs'
const root = resolve(import.meta.dirname, '../..'),
  work = join(root, 'research/go-cli')

const host = `${process.platform === 'win32' ? 'windows' : process.platform}-${process.arch === 'x64' ? 'amd64' : process.arch}`
const binary = join(work, `xplat-go-${host}-cli${process.platform === 'win32' ? '.exe' : ''}`),
  build = JSON.parse(readFileSync(binary + '.json'))

const sha = (b) => createHash('sha256').update(b).digest('hex')
assert.equal(sha(readFileSync(binary)), build.sha256)
for (const [file, hash] of Object.entries(build.inputs)) {
  assert.equal(sha(readFileSync(join(root, file))), hash, file)
}

const scratch = realpathSync(scratchRun(root, 'go-add'))
after(() => rmSync(scratch, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }))
const tools = projectToolFixture(root, work, scratch, {
  vite: false,
  packageManagement: true,
  creator: true,
})

const creator = realpathSync(join(tools.nodeModules, 'create-octane-xplat')),
  oracle = await import(pathToFileURL(join(creator, 'dist/scaffold.js')).href)

let sequence = 0
function put(dir, file, data) {
  const path = join(dir, file)
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, typeof data === 'string' ? data : JSON.stringify(data, null, 2) + '\n')
  return path
}

function fixture(initial = ['web'], installed = true) {
  const dir = join(scratch, 'app ' + sequence++ + ' π')
  mkdirSync(dir)
  oracle.composeTargets(initial, dir)
  if (installed) {
    symlinkSync(
      tools.nodeModules,
      join(dir, 'node_modules'),
      process.platform === 'win32' ? 'junction' : 'dir',
    )
  }
  return dir
}

function tree(dir) {
  const files = {}
  const visit = (path) => {
    for (const entry of readdirSync(path, { withFileTypes: true })) {
      if (entry.name === 'node_modules') {
        continue
      }

      const file = join(path, entry.name)
      if (entry.isDirectory()) {
        visit(file)
      } else if (entry.isFile()) {
        files[relative(dir, file).replaceAll('\\', '/')] = sha(readFileSync(file))
      }
    }
  }
  visit(dir)
  return files
}

function run(dir, args = [], overlay = {}) {
  return spawnSync(binary, ['add', ...args], {
    cwd: dir,
    env: { ...process.env, NODE_OPTIONS: '', NODE_PATH: '', ...overlay },
    encoding: 'utf8',
    timeout: 45000,
    maxBuffer: 16 << 20,
  })
}

function success(r) {
  assert.ifError(r.error)
  assert.equal(r.status, 0, r.stdout + r.stderr)
  assert.equal(r.signal, null)
}

test('add help and schema need neither Node nor a generator', () => {
  const dir = fixture([], false)
  success(run(dir, ['--help'], { PATH: '' }))
  const r = run(dir, ['--schema'], { PATH: '' })
  success(r)
  assert.ok(r.stdout.includes('no-install'))
})

test('native add uses the actual creator for web/iOS/Android output and preserves user files', () => {
  for (const initial of [['web'], ['ios'], ['android']]) {
    for (const target of ['web', 'ios', 'android']) {
      const actual = fixture(initial),
        reference = fixture(initial, false)

      for (const dir of [actual, reference]) {
        const pkg = JSON.parse(readFileSync(join(dir, 'package.json')))
        pkg.scripts.test = 'custom test'
        put(dir, 'package.json', pkg)
        put(dir, 'user-data.txt', 'preserve π😀')
      }

      oracle.applyTarget(reference, target)
      const r = run(actual, [target, '--no-install'])
      success(r)
      assert.deepEqual(tree(actual), tree(reference), initial + ' -> ' + target)
      assert.equal(readFileSync(join(actual, 'user-data.txt'), 'utf8'), 'preserve π😀')
      const before = tree(actual)
      success(run(actual, [target, '--no-install']))
      assert.deepEqual(tree(actual), before, 'idempotent')
    }
  }
})

test('workspace catalog and patch ownership match the creator', () => {
  function workspace() {
    const dir = join(scratch, 'workspace ' + sequence++)
    put(dir, 'package.json', { private: true, packageManager: 'bun@1.4.4', workspaces: ['apps/*'] })
    const app = join(dir, 'apps/app')
    mkdirSync(app, { recursive: true })
    oracle.composeTargets(['web'], app)
    symlinkSync(
      tools.nodeModules,
      join(app, 'node_modules'),
      process.platform === 'win32' ? 'junction' : 'dir',
    )
    return { dir, app }
  }
  const a = workspace(),
    b = workspace()
  oracle.applyTarget(b.app, 'android')
  success(run(a.app, ['android', '--no-install']))
  assert.deepEqual(tree(a.dir), tree(b.dir))
})

test('invalid targets, pnpm and missing generators fail without project writes', () => {
  for (const mode of ['unknown', 'pnpm', 'missing']) {
    const dir = fixture(['web'], mode !== 'missing')
    if (mode === 'pnpm') {
      const pkg = JSON.parse(readFileSync(join(dir, 'package.json')))
      pkg.packageManager = 'pnpm@11.24.0'
      put(dir, 'package.json', pkg)
    }

    const before = tree(dir)
    const r = run(dir, [mode === 'unknown' ? 'bogus' : 'ios', '--no-install'])
    assert.notEqual(r.status, 0)
    assert.deepEqual(tree(dir), before)
  }
})

test('managed output aliases fail before any source/manifest publication', () => {
  for (const path of ['tsconfig.json', 'src', 'patches']) {
    const dir = fixture(['web']),
      outside = join(scratch, 'outside ' + sequence++)

    mkdirSync(outside)
    put(outside, 'keep', 'user data')
    if (existsSync(join(dir, path))) {
      rmSync(join(dir, path), { recursive: true, force: true })
    }

    const dest = path === 'tsconfig.json' ? put(outside, 'config.json', '{}\n') : outside
    symlinkSync(
      dest,
      join(dir, path),
      process.platform === 'win32' && path !== 'tsconfig.json' ? 'junction' : undefined,
    )

    const manifest = readFileSync(join(dir, 'package.json')),
      outsideBefore = tree(outside),
      r = run(dir, ['ios', '--no-install'])

    assert.notEqual(r.status, 0, r.stdout + r.stderr)
    assert.deepEqual(readFileSync(join(dir, 'package.json')), manifest)
    assert.deepEqual(tree(outside), outsideBefore)
  }
})

function fake(dir, body) {
  put(dir, 'node_modules/@octane-xplat/cli/package.json', {
    name: '@octane-xplat/cli',
    type: 'module',
    exports: { './worker': './fake.mjs' },
  })
  put(
    dir,
    'node_modules/@octane-xplat/cli/fake.mjs',
    `import{readFileSync,writeFileSync,lstatSync}from'node:fs';import{join}from'node:path';import{createHash}from'node:crypto';const[input,output]=process.argv.slice(2),r=JSON.parse(readFileSync(input)),hash=b=>createHash('sha256').update(b).digest('hex');const project=process.cwd(),root=r.workspaceRoot,pkg=join(project,'package.json'),file=join(project,'new-generated.ts');let data={version:1,root,project,frameworkVersion:r.frameworkVersion,targets:[{id:'web',label:'Web',note:'',enabled:false}]};if(r.operation==='add-plan'){data.plan={version:1,root,appRoot:project,id:r.target,files:[{path:file,before:null,content:Buffer.from('generated\\n').toString('base64'),mode:420}],directories:[],inputs:[{path:pkg,kind:'file',sha256:hash(readFileSync(pkg)),mode:lstatSync(pkg).mode&511},{path:file,kind:'missing'}],report:{enabled:['web'],already:[],copied:[],skipped:[],scriptsAdded:[],scriptsSkipped:[],depsAdded:[]}};${body}}writeFileSync(output,JSON.stringify({protocol:r.protocol,version:r.version,id:r.id,ok:true,data}))`,
  )
}

test('a valid isolated worker plan reaches native publication', () => {
  const dir = fixture([], false)
  fake(dir, '')
  success(run(dir, ['web', '--no-install']))
  assert.equal(readFileSync(join(dir, 'new-generated.ts'), 'utf8'), 'generated\n')
})

test('invalid worker plans never broaden write ownership or infer missing roots', () => {
  for (const body of [
    'delete data.root',
    'data.root=null',
    "data.plan.root=''",
    'data.plan.files.push(data.plan.files[0])',
    "data.plan.files[0].path=join(project,'..','escape.ts')",
    "data.plan.files[0].content='not base64!'",
    'data.plan.files[0].mode=4095',
    'data.plan.inputs=[]',
    "const p=join(project,'user-data.txt');data.plan.files[0]={path:p,before:hash(readFileSync(p)),content:Buffer.from('overwrite').toString('base64'),mode:lstatSync(p).mode&511};data.plan.inputs[1]={path:p,kind:'file',sha256:hash(readFileSync(p)),mode:lstatSync(p).mode&511}",
  ]) {
    const dir = fixture([], false)
    put(dir, 'user-data.txt', 'keep')
    fake(dir, body)
    const before = tree(dir)
    const r = run(dir, ['web', '--no-install'])
    assert.notEqual(r.status, 0, body)
    assert.doesNotMatch(r.stderr, /SyntaxError|ReferenceError/, body)
    assert.deepEqual(tree(dir), before, body)
  }
})

test('stale manifest observations are rejected before native generation', () => {
  const dir = fixture([], false)
  fake(dir, "writeFileSync(pkg,readFileSync(pkg,'utf8')+'\\n')")
  const before = readFileSync(join(dir, 'package.json'), 'utf8')
  const r = run(dir, ['web', '--no-install'])
  assert.notEqual(r.status, 0)
  assert.match(r.stderr, /changed during planning/)
  assert.equal(existsSync(join(dir, 'new-generated.ts')), false)
  assert.equal(readFileSync(join(dir, 'package.json'), 'utf8'), before + '\n')
})

test('default install rejects a shared node_modules alias before platform writes', () => {
  const dir = fixture(['web']),
    before = tree(dir),
    r = run(dir, ['ios'])
  assert.notEqual(r.status, 0)
  assert.match(r.stderr, /ordinary node_modules/)
  assert.deepEqual(tree(dir), before)
})

function installFixture(hook) {
  const dir = join(scratch, 'install ' + sequence++)
  mkdirSync(dir)
  const devDependencies = Object.fromEntries(
    tools.packages.packages.map((p) => [
      p.name,
      'file:' + join(tools.archiveDirectory, p.file).replaceAll('\\', '/'),
    ]),
  )
  for (const name of ['jsdom', '@octanejs/vite-plugin']) {
    const dep = join(scratch, 'local ' + name.replaceAll('/', '-'))
    put(dep, 'package.json', { name, version: '1.0.0' })
    devDependencies[name] = 'file:' + dep.replaceAll('\\', '/')
  }
  put(dir, 'package.json', {
    name: 'real-install',
    private: true,
    type: 'module',
    packageManager: 'bun@1.4.4',
    devDependencies,
    scripts: { postinstall: 'node hook.mjs' },
  })
  put(dir, 'hook.mjs', hook)
  const initial = spawnSync('bun', ['install', '--ignore-scripts', '--linker', 'isolated'], {
    cwd: dir,
    encoding: 'utf8',
    timeout: 120000,
  })
  success(initial)
  return dir
}

test('default addition runs the real Bun installer with project-owned packages and a live hook', () => {
  const dir = installFixture(
    "import{writeFileSync}from'node:fs';console.log('ADD_INSTALL_STDOUT');console.error('ADD_INSTALL_STDERR');writeFileSync('installed.marker','yes')",
  )
  const r = run(dir, ['web'])
  success(r)
  assert.match(r.stdout, /ADD_INSTALL_STDOUT/)
  assert.match(r.stderr, /ADD_INSTALL_STDERR/)
  assert.equal(readFileSync(join(dir, 'installed.marker'), 'utf8'), 'yes')
  assert.equal(existsSync(join(dir, 'vite.config.ts')), true)
})

test('project creator absence and mismatched versions have explicit installation diagnostics', () => {
  for (const version of [null, '0.0.0-wrong']) {
    const dir = fixture([], false),
      cli = join(dir, 'node_modules/@octane-xplat/cli')

    mkdirSync(dirname(cli), { recursive: true })
    symlinkSync(
      realpathSync(join(tools.nodeModules, '@octane-xplat/cli')),
      cli,
      process.platform === 'win32' ? 'junction' : 'dir',
    )

    if (version) {
      put(dir, 'node_modules/create-octane-xplat/package.json', {
        name: 'create-octane-xplat',
        version,
      })
    }

    const before = tree(dir),
      r = run(dir, ['web', '--no-install'])

    assert.notEqual(r.status, 0)
    assert.match(
      r.stderr,
      version ? /requires create-octane-xplat@/ : /Install create-octane-xplat@/,
    )

    assert.deepEqual(tree(dir), before)
  }
})

for (const answer of ['web', 'cancel']) {
  test(
    `POSIX terminal selection ${answer} is explicit`,
    { skip: process.platform === 'win32' },
    () => {
      const dir = fixture([], true),
        before = tree(dir)
      const r = spawnSync(
        'python3',
        ['-I', join(root, 'tools/cli-go/add-terminal.py'), binary, answer],
        {
          cwd: dir,
          env: { ...process.env, NODE_OPTIONS: '', NODE_PATH: '' },
          encoding: 'utf8',
          timeout: 25000,
        },
      )
      success(r)
      const result = JSON.parse(r.stdout)
      assert.equal(result.code, 0, result.output)
      assert.equal(result.promptObserved, true, result.output)
      if (answer === 'web') {
        assert.equal(existsSync(join(dir, 'vite.config.ts')), true)
      } else {
        assert.deepEqual(tree(dir), before)
      }
    },
  )
}

function alive(pid) {
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}

test('cancelling a real add install cleans descendants and releases the project lease', async (t) => {
  const dir = installFixture(
    `import{spawn}from'node:child_process';import{writeFileSync}from'node:fs';process.on('SIGTERM',()=>{});const leaf=spawn(process.execPath,['-e',"process.on('SIGTERM',()=>{});setInterval(()=>{},1000)"],{stdio:'ignore'});writeFileSync('hook-pids.json',JSON.stringify([process.pid,leaf.pid]));setInterval(()=>{},1000)`,
  )
  const child = spawn(binary, ['add', 'web'], {
    cwd: dir,
    env: { ...process.env, NODE_OPTIONS: '', NODE_PATH: '' },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  let output = ''
  child.stdout.on('data', (b) => (output += b))
  child.stderr.on('data', (b) => (output += b))
  t.after(() => {
    if (child.exitCode === null && child.signalCode === null) {
      child.kill('SIGKILL')
    }
  })
  const deadline = Date.now() + 20000
  while (!existsSync(join(dir, 'hook-pids.json')) && Date.now() < deadline) {
    await delay(25)
  }
  assert.equal(existsSync(join(dir, 'hook-pids.json')), true, output)
  const pids = JSON.parse(readFileSync(join(dir, 'hook-pids.json'))),
    closed = once(child, 'close')
  child.kill('SIGTERM')
  await closed
  for (const pid of pids) {
    const until = Date.now() + 6000
    while (alive(pid) && Date.now() < until) {
      await delay(25)
    }

    assert.equal(alive(pid), false, 'hook descendant survived: ' + pid)
  }
  if (process.platform !== 'win32') {
    assert.match(output, /workspace files may have changed/)
  }
  success(run(dir, ['web', '--no-install']))
})
