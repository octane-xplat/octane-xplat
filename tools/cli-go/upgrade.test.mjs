import assert from 'node:assert/strict'
import { test, after } from 'node:test'
import { spawnSync, spawn } from 'node:child_process'
import { once } from 'node:events'
import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  rmSync,
  symlinkSync,
  realpathSync,
  existsSync,
  statSync,
  chmodSync,
  cpSync,
} from 'node:fs'

import { join, resolve, dirname, relative } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createHash } from 'node:crypto'
import { setTimeout as delay } from 'node:timers/promises'
import { scratchRun } from './scratch.mjs'
import { projectToolFixture } from './project-fixtures.mjs'

const root = resolve(import.meta.dirname, '../..'),
  work = join(root, 'research/go-cli')

const host = `${process.platform === 'win32' ? 'windows' : process.platform}-${process.arch === 'x64' ? 'amd64' : process.arch}`
const suffix = process.platform === 'win32' ? '.exe' : ''
const binary = join(work, `xplat-go-${host}-cli${suffix}`),
  probe = join(work, `xplat-go-${host}${suffix}`)

const sha = (bytes) => createHash('sha256').update(bytes).digest('hex')
const build = JSON.parse(readFileSync(binary + '.json'))
assert.equal(sha(readFileSync(binary)), build.sha256)
for (const [file, hash] of Object.entries(build.inputs)) {
  assert.equal(sha(readFileSync(join(root, file))), hash, file)
}

const probeBuild = JSON.parse(readFileSync(probe + '.json'))
assert.equal(sha(readFileSync(probe)), probeBuild.sha256)
assert.deepEqual(probeBuild.inputs, build.inputs)
const scratch = realpathSync(scratchRun(root, 'go-upgrade'))
after(() => rmSync(scratch, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }))
const tools = projectToolFixture(root, work, scratch, { vite: false, packageManagement: true })
const compatibility = JSON.parse(
  readFileSync(join(dirname(tools.worker), 'compatibility-data/compatibility.json')),
)

const env = {
  ...process.env,
  NODE_OPTIONS: '',
  NODE_PATH: '',
  HOME: join(scratch, 'home'),
  XDG_CACHE_HOME: join(scratch, 'cache'),
  LOCALAPPDATA: join(scratch, 'local-app-data'),
}

let sequence = 0
function put(dir, name, content) {
  const file = join(dir, name)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(
    file,
    typeof content === 'string' ? content : JSON.stringify(content, null, 2) + '\n',
  )
  return file
}

function fixture(manifest = {}, files = {}, installed = true) {
  const dir = join(scratch, 'project ' + sequence++ + ' π')
  put(dir, 'package.json', {
    name: 'upgrade-fixture',
    private: true,
    packageManager: `bun@${compatibility.tools.bun}`,
    ...manifest,
  })
  for (const [name, content] of Object.entries(files)) {
    put(dir, name, content)
  }
  if (installed) {
    symlinkSync(
      tools.nodeModules,
      join(dir, 'node_modules'),
      process.platform === 'win32' ? 'junction' : 'dir',
    )
  }
  return dir
}

function run(dir, args = [], overlay = {}) {
  return spawnSync(binary, ['upgrade', ...args], {
    cwd: dir,
    env: { ...env, ...overlay },
    encoding: 'utf8',
    timeout: 60000,
    maxBuffer: 16 << 20,
  })
}

function success(r) {
  assert.equal(r.status, 0, r.stdout + r.stderr)
  assert.equal(r.signal, null)
}

function oracle(dir) {
  const url = pathToFileURL(join(dirname(tools.worker), 'compatibility.js')).href
  const source = `import {planUpgrade}from ${JSON.stringify(url)};console.log(JSON.stringify(planUpgrade(process.cwd())))`
  const r = spawnSync(
    probe,
    ['exec', '--project', dir, '--', process.execPath, '--input-type=module', '-e', source],
    { cwd: dir, env, encoding: 'utf8', timeout: 30000, maxBuffer: 16 << 20 },
  )
  success(r)
  const result = JSON.parse(r.stdout)
  assert.equal(result.exitCode, 0, result.stderr)
  assert.equal(result.truncated, false)
  assert.equal(result.cancelled, false)
  return JSON.parse(result.stdout)
}

function compareApply(dir) {
  const plan = oracle(dir)
  const before = plan.files.map((file) => [file.path, file.before])
  const preview = run(dir, ['--check'])
  assert.equal(preview.status, plan.files.length ? 1 : 0, preview.stdout + preview.stderr)
  for (const [path, content] of before) {
    assert.equal(existsSync(path) ? readFileSync(path, 'utf8') : null, content)
  }
  const result = run(dir, ['--no-install'])
  success(result)
  for (const file of plan.files) {
    assert.equal(readFileSync(file.path, 'utf8'), file.after, relative(dir, file.path))
  }
  assert.match(result.stdout, /Compatibility files updated/)
  const times = plan.files.map((file) => statSync(file.path).mtimeMs)
  success(run(dir, ['--no-install']))
  assert.deepEqual(
    plan.files.map((file) => statSync(file.path).mtimeMs),
    times,
  )
  assert.equal(run(dir, ['--check']).status, 0)
  return plan
}

test('upgrade help/schema and usage errors are native without Node', () => {
  const dir = fixture()
  success(run(dir, ['--help'], { PATH: '' }))
  const schema = run(dir, ['--schema'], { PATH: '' })
  success(schema)
  assert.equal(JSON.parse(schema.stdout).data.status, 'implemented')
  for (const args of [['--unknown'], ['unexpected']]) {
    assert.notEqual(run(dir, args, { PATH: '' }).status, 0)
  }
  const absent = run(dir, ['--check'], { PATH: '' })
  assert.notEqual(absent.status, 0)
  assert.match(absent.stderr, /Node is required/)
})

test('Bun catalogs, native channel choices, patch bytes and excluded packages agree with the canonical planner', () => {
  const dir = fixture(
    {
      workspaces: { packages: ['apps/*', '!apps/excluded'] },
      engines: { node: '>=30' },
      scripts: { custom: 'leave-me' },
    },
    {
      'apps/mobile/package.json': {
        private: true,
        dependencies: {
          '@nativescript-community/octane': '0.0.1',
          '@triniwiz/nativescript-masonkit': '1.0.0',
          '@octane-xplat/ui': '0.0.1',
        },
        devDependencies: { '@octane-xplat/cli': build.cliVersion },
      },
      'apps/excluded/package.json': {
        private: true,
        dependencies: { '@octane-xplat/ui': '0.0.1' },
      },
    },
  )
  const manifest = join(dir, 'apps/mobile/package.json')
  if (process.platform !== 'win32') {
    chmodSync(manifest, 0o640)
  }
  const excluded = readFileSync(join(dir, 'apps/excluded/package.json'))
  const plan = compareApply(dir)
  assert.ok(plan.files.some((file) => file.path.endsWith('.patch')))
  assert.deepEqual(readFileSync(join(dir, 'apps/excluded/package.json')), excluded)
  assert.equal(JSON.parse(readFileSync(join(dir, 'package.json'))).engines.node, '>=30')
  if (process.platform !== 'win32') {
    assert.equal(statSync(manifest).mode & 0o777, 0o640)
  }
})

test('pnpm YAML comments, catalogs, local links and Windows pins agree with the canonical planner', () => {
  const dir = fixture(
    { packageManager: `pnpm@${compatibility.tools.pnpm}` },
    {
      'pnpm-workspace.yaml':
        '# preserve workspace policy\npackages:\n  - apps/*\ncatalogs:\n  custom:\n    octane: 0.0.1\nonlyBuiltDependencies:\n  - app-owned-tool\n',
      'apps/windows/package.json': {
        private: true,
        devDependencies: {
          '@nativescript/windows': '0.0.1',
          '@octane-xplat/cli': build.cliVersion,
        },
        dependencies: {
          octane: 'catalog:custom',
          '@octane-xplat/ui': '0.0.1',
          'app-local': 'workspace:*',
        },
      },
    },
  )
  compareApply(dir)
  assert.match(
    readFileSync(join(dir, 'pnpm-workspace.yaml'), 'utf8'),
    /# preserve workspace policy/,
  )
  assert.equal(
    JSON.parse(readFileSync(join(dir, 'apps/windows/package.json'))).dependencies['app-local'],
    'workspace:*',
  )
})

function installFixture(files = {}) {
  const installed = JSON.parse(readFileSync(join(dirname(tools.nodeModules), 'package.json')))
  const dir = fixture(
    { devDependencies: installed.devDependencies, overrides: installed.overrides },
    files,
    false,
  )
  const setup = spawnSync('bun', ['install', '--ignore-scripts', '--linker', 'isolated'], {
    cwd: dir,
    env,
    encoding: 'utf8',
    timeout: 120000,
  })
  success(setup)
  return dir
}

test('default upgrade executes the actual Bun install and post-install verification', () => {
  const dir = installFixture()
  const r = run(dir)
  success(r)
  assert.match(r.stdout, /Installed and checked the compatibility set/)
  assert.match(r.stdout + r.stderr, /bun install/)
  assert.equal(run(dir, ['--check']).status, 0)
})

test('pinned pnpm installs through a real command shim and passes post-install verification', async (t) => {
  const tool = join(scratch, 'pnpm engine')
  put(tool, 'package.json', { private: true, devDependencies: { pnpm: compatibility.tools.pnpm } })
  const bootstrap = spawnSync('bun', ['install', '--ignore-scripts', '--linker', 'isolated'], {
    cwd: tool,
    env,
    encoding: 'utf8',
    timeout: 120000,
  })
  success(bootstrap)
  const packageRoot = join(tool, 'node_modules/pnpm')
  const manifest = JSON.parse(readFileSync(join(packageRoot, 'package.json')))
  assert.equal(manifest.version, compatibility.tools.pnpm)
  const entry = realpathSync(join(packageRoot, manifest.bin.pnpm))
  const bin = join(scratch, 'pnpm bin')
  const quote = (value) => "'" + value.replaceAll("'", "'\\''") + "'"
  const shim =
    process.platform === 'win32'
      ? put(bin, 'pnpm.cmd', `@"${process.execPath}" "${entry}" %*\r\n`)
      : put(bin, 'pnpm', `#!/bin/sh\nexec ${quote(process.execPath)} ${quote(entry)} "$@"\n`)
  if (process.platform !== 'win32') {
    chmodSync(shim, 0o755)
  }
  const overlay = {
    PATH: bin + (process.platform === 'win32' ? ';' : ':') + process.env.PATH,
    CI: '1',
    pnpm_config_manage_package_manager_versions: 'false',
    pnpm_config_store_dir: join(scratch, 'pnpm store'),
  }
  const installed = JSON.parse(readFileSync(join(dirname(tools.nodeModules), 'package.json')))
  const dir = fixture(
    {
      packageManager: `pnpm@${compatibility.tools.pnpm}`,
      devDependencies: installed.devDependencies,
      overrides: installed.overrides,
    },
    { 'pnpm-workspace.yaml': 'packages: []\n' },
    false,
  )
  const setup = spawnSync(
    process.execPath,
    [entry, 'install', '--ignore-scripts', '--no-frozen-lockfile'],
    { cwd: dir, env: { ...env, ...overlay }, encoding: 'utf8', timeout: 120000 },
  )
  success(setup)
  const pkg = JSON.parse(readFileSync(join(dir, 'package.json')))
  pkg.scripts = { postinstall: 'node pnpm-hook.mjs' }
  put(dir, 'package.json', pkg)
  put(
    dir,
    'pnpm-hook.mjs',
    "import{writeFileSync}from'node:fs';writeFileSync('pnpm-hook-ran','yes');console.log('pnpm hook stdout')",
  )

  const patchPackage = join(scratch, 'patch config package')
  put(patchPackage, 'package.json', {
    name: '@octane-xplat/patches',
    version: compatibility.frameworkVersion,
    private: true,
    files: ['patches'],
  })
  cpSync(join(dirname(tools.worker), '../patches'), join(patchPackage, 'patches'), {
    recursive: true,
  })
  const packed = spawnSync(
    'bun',
    ['pm', 'pack', '--ignore-scripts', '--destination', patchPackage],
    { cwd: patchPackage, env, encoding: 'utf8', timeout: 30000 },
  )
  success(packed)
  const archive = join(patchPackage, `octane-xplat-patches-${compatibility.frameworkVersion}.tgz`)
  const ready = join(patchPackage, 'ready.json'),
    requests = join(patchPackage, 'requests.json')
  const input = put(patchPackage, 'registry.json', {
    archive,
    version: compatibility.frameworkVersion,
    ready,
    requests,
  })
  const registry = spawn(
    process.execPath,
    [join(root, 'tools/cli-go/upgrade-registry-fixture.mjs'), input],
    { env, stdio: 'ignore' },
  )
  const closed = once(registry, 'close')
  t.after(async () => {
    if (registry.exitCode === null && registry.signalCode === null) {
      registry.kill('SIGKILL')
    }
    await closed
  })
  await waitFor(ready)
  for (const name of Object.keys(env)) {
    if (['npm_config_registry', 'pnpm_config_registry'].includes(name.toLowerCase())) {
      overlay[name] = undefined
    }
  }
  // Route only the source-owned config package; ordinary dependencies retain
  // their registry and existing lockfile identities.
  put(
    dir,
    '.npmrc',
    `@octane-xplat:registry=http://127.0.0.1:${JSON.parse(readFileSync(ready)).port}/\n`,
  )

  const result = run(dir, [], overlay)
  success(result)
  assert.match(result.stdout, /Installed and checked the compatibility set/)
  assert.ok(existsSync(join(dir, 'pnpm-lock.yaml')))
  assert.equal(readFileSync(join(dir, 'pnpm-hook-ran'), 'utf8'), 'yes')
  assert.match(result.stdout, /pnpm hook stdout/)
  assert.ok(JSON.parse(readFileSync(requests)).includes('/patches.tgz'))
  const directVersion = spawnSync('pnpm', ['--version'], {
    cwd: dir,
    env: { ...env, ...overlay },
    encoding: 'utf8',
    timeout: 10000,
  })
  writeFileSync(
    join(work, `upgrade-pnpm-${host}.json`),
    JSON.stringify(
      {
        binarySha256: build.sha256,
        engineVersion: manifest.version,
        directVersionProbe: {
          status: directVersion.status,
          error: directVersion.error?.code,
          stdout: directVersion.stdout,
        },
        entrySha256: sha(readFileSync(entry)),
        configPackageSha256: sha(readFileSync(archive)),
        registryRequests: JSON.parse(readFileSync(requests)),
        shim: process.platform === 'win32' ? '.cmd' : 'POSIX shell',
        exitCode: result.status,
        stdout: result.stdout,
        stderr: result.stderr,
      },
      null,
      2,
    ) + '\n',
  )
  const request = put(dir, 'pnpm-doctor-request.json', {})
  const report = spawnSync(
    probe,
    ['worker', '--project', dir, '--operation', 'doctor', '--request', request],
    { cwd: dir, env: { ...env, ...overlay }, encoding: 'utf8', timeout: 30000 },
  )
  success(report)
  const data = JSON.parse(report.stdout).data
  assert.equal(data.rows.find((row) => row.name === 'pnpm').ok, true)
  assert.equal(data.rows.find((row) => row.name === 'compatibility pnpm').ok, true)
})

test('failed actual install retains both streams and discloses already updated files', () => {
  const dir = installFixture({
    'install-failure.mjs':
      "console.log('install stdout marker');console.error('install stderr marker');process.exit(7)",
  })
  const pkg = JSON.parse(readFileSync(join(dir, 'package.json')))
  pkg.scripts = { postinstall: 'node install-failure.mjs' }
  pkg.packageManager = 'bun@0.0.1'
  put(dir, 'package.json', pkg)
  const r = run(dir)
  assert.equal(r.status, 1, r.stdout + r.stderr)
  assert.match(r.stdout, /install stdout marker/)
  assert.match(r.stderr, /install stderr marker/)
  assert.match(r.stderr, /workspace files may have changed/)
  assert.equal(
    JSON.parse(readFileSync(join(dir, 'package.json'))).packageManager,
    `bun@${compatibility.tools.bun}`,
  )
  success(run(dir, ['--no-install']))
})

test('default installation rejects a workspace node_modules alias before metadata writes', () => {
  const dir = fixture({ engines: { node: '>=1' } }),
    before = readFileSync(join(dir, 'package.json'))
  const r = run(dir)
  assert.equal(r.status, 1)
  assert.match(r.stderr, /ordinary workspace node_modules/)
  assert.deepEqual(readFileSync(join(dir, 'package.json')), before)
})

function fake(dir, body) {
  put(dir, 'node_modules/@octane-xplat/cli/package.json', {
    name: '@octane-xplat/cli',
    type: 'module',
    exports: { './worker': './worker.mjs' },
  })
  put(
    dir,
    'node_modules/@octane-xplat/cli/worker.mjs',
    `import{readFileSync,writeFileSync}from'node:fs';const[input,output]=process.argv.slice(2),r=JSON.parse(readFileSync(input));let data={version:1,root:r.workspaceRoot,manager:r.expectedManager,frameworkVersion:r.frameworkVersion,digest:'a'.repeat(64),plan:{root:r.workspaceRoot,version:r.frameworkVersion,packages:[r.workspaceRoot],projects:[],updates:[],skipped:[],files:[]}};${body};writeFileSync(output,JSON.stringify({protocol:r.protocol,version:r.version,id:r.id,ok:true,data}));`,
  )
}

test('malformed, foreign, stale and escaping plans cannot start a mutating worker', () => {
  for (const body of [
    "data.frameworkVersion='other-release'",
    "data.root=r.workspaceRoot+'/foreign'",
    'delete data.root;delete data.plan.root',
    "data.plan.files=[{path:r.workspaceRoot+'/../escape',before:null,after:'unsafe'}]",
    "data.plan.files=[{path:r.workspaceRoot+'/package.json',before:'stale',after:'unsafe'}]",
    'delete data.plan.packages',
  ]) {
    const dir = fixture({}, {}, false),
      before = readFileSync(join(dir, 'package.json'))

    fake(dir, `if(r.operation!=='upgrade-plan')writeFileSync('mutation-started','bad');${body}`)
    const r = run(dir, ['--no-install'])
    assert.equal(r.status, 1, r.stdout + r.stderr)
    assert.equal(existsSync(join(dir, 'mutation-started')), false)
    assert.deepEqual(readFileSync(join(dir, 'package.json')), before)
  }
})

test('actual upgrade worker refuses stale digests and mismatched release requests without writes', () => {
  const dir = fixture({ engines: { node: '>=1' } }),
    before = readFileSync(join(dir, 'package.json'))
  for (const payload of [
    { operation: 'upgrade-plan', frameworkVersion: 'wrong-release' },
    {
      operation: 'upgrade-apply',
      frameworkVersion: compatibility.frameworkVersion,
      digest: '0'.repeat(64),
    },
  ]) {
    const file = put(dir, 'worker-request.json', {
      workspaceRoot: dir,
      expectedManager: 'bun',
      ...payload,
    })

    const r = spawnSync(
      probe,
      ['worker', '--project', dir, '--operation', payload.operation, '--request', file],
      { cwd: dir, env, encoding: 'utf8', timeout: 30000 },
    )

    assert.equal(r.status, 1, r.stdout + r.stderr)
    assert.match(r.stdout, /requires the CLI worker|Workspace changed during upgrade/)
    assert.deepEqual(readFileSync(join(dir, 'package.json')), before)
  }
})

async function waitFor(file) {
  const deadline = Date.now() + 15000
  while (!existsSync(file)) {
    assert.ok(Date.now() < deadline, 'timed out waiting for install hook')
    await delay(25)
  }
}

function alive(pid) {
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}

test('cancellation during a real install cleans hook descendants and releases workspace leases', async (t) => {
  const dir = installFixture({
    'install-wait.mjs': `import{spawn}from'node:child_process';import{writeFileSync}from'node:fs';process.on('SIGTERM',()=>{});const child=spawn(process.execPath,['-e',"process.on('SIGTERM',()=>{});setInterval(()=>{},1000)"],{stdio:'ignore'});writeFileSync('hook-pids.json',JSON.stringify([process.pid,child.pid]));setInterval(()=>{},1000)`,
  })
  const pkg = JSON.parse(readFileSync(join(dir, 'package.json')))
  pkg.scripts = { postinstall: 'node install-wait.mjs' }
  put(dir, 'package.json', pkg)
  const child = spawn(binary, ['upgrade'], { cwd: dir, env, stdio: ['ignore', 'pipe', 'pipe'] })
  let output = ''
  child.stdout.on('data', (c) => (output += c))
  child.stderr.on('data', (c) => (output += c))
  t.after(() => {
    if (child.exitCode === null && child.signalCode === null) {
      child.kill('SIGKILL')
    }
  })
  await waitFor(join(dir, 'hook-pids.json'))
  const pids = JSON.parse(readFileSync(join(dir, 'hook-pids.json')))
  const closed = once(child, 'close')
  child.kill('SIGTERM')
  await closed
  for (const pid of pids) {
    const deadline = Date.now() + 6000
    while (alive(pid) && Date.now() < deadline) {
      await delay(25)
    }

    assert.equal(alive(pid), false, 'hook descendant survived: ' + pid)
  }
  if (process.platform !== 'win32') {
    assert.match(output, /workspace files may have changed/)
  }
  success(run(dir, ['--no-install']))
})
