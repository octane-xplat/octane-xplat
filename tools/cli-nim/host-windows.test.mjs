// Real Windows detached owners, private pipes, job guards and public clients.
import { test, after } from 'node:test'
import assert from 'node:assert/strict'
import { spawn, spawnSync } from 'node:child_process'
import { createConnection } from 'node:net'
import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { scratchRun } from './scratch.mjs'
import { assertCurrentNativeBuild, hostProbeInputs } from './native-inputs.mjs'
import { assertPortabilityArtifact } from './portability-proof.mjs'

const root = resolve(import.meta.dirname, '../..'), windows = process.platform === 'win32'
const host = { skip: !windows, timeout: 25000 }
const portable = existsSync(join(root, 'portability-source.json'))
const work = portable ? resolve(process.env.XPLAT_NIM_PORTABILITY_CACHE ?? join(root, 'research/nim-portability')) : join(root, 'research/nim-cli')
const probe = join(work, portable ? 'bin/host-probe.exe' : 'native/host-probe.exe')
const binary = join(work, portable ? 'bin/xplat.exe' : 'native/xplat.exe')
const owned = new Map(), directories = new Set(), children = new Set(), guests = new Set(), evidence = []
let scratch, sequence = 0
if (windows) {
 scratch = scratchRun(root, 'host-windows')
 if (portable) {
  assertPortabilityArtifact(root, JSON.parse(readFileSync(join(work, 'host-build-result.json'))), readFileSync(probe), 'tools/cli-nim/host_probe.nim')
  assertPortabilityArtifact(root, JSON.parse(readFileSync(join(work, 'build-result.json'))), readFileSync(binary), 'packages/cli/nim/main.nim')
 } else {
  assertCurrentNativeBuild(root, JSON.parse(readFileSync(join(work, 'native/host-build.json'))), readFileSync(probe), hostProbeInputs)
  assertCurrentNativeBuild(root, JSON.parse(readFileSync(join(work, 'native/build.json'))), readFileSync(binary))
 }
}
const environment = { ...process.env, PATH: '', NODE_PATH: '', NODE_OPTIONS: '', XPLAT_AGENT_HOST_IDLE_MS: '6000' }
function call(request) {
 const result = spawnSync(probe, [], { input: JSON.stringify(request)+'\n', encoding: 'utf8', env: environment, timeout: 12000 })
 assert.equal(result.status, 0, result.stderr || result.error?.message)
 const value = JSON.parse(result.stdout)
 evidence.push({ request, result: value }); return value
}
async function concurrent(request, argumentsForPid) {
 const child = spawn(probe, [], { env: environment, stdio: ['pipe','pipe','pipe'] })
 if (argumentsForPid) {request = { ...request, args: argumentsForPid(child.pid) }}
 let output = '', errors = ''
 const done = new Promise((resolve, reject) => {
  child.stdout.on('data', bytes => {output += bytes}); child.stderr.on('data', bytes => {errors += bytes})
  child.once('error', reject)
  child.once('close', code => {
   try {assert.equal(code, 0, errors); const value = JSON.parse(output); evidence.push({ request, result: value }); resolve(value)}
   catch (error) {reject(error)}
  })
 })
 const timer = setTimeout(() => child.kill('SIGKILL'), 12000)
 child.stdin.end(JSON.stringify(request)+'\n')
 try {return await done} finally {clearTimeout(timer)}
}
function fixture() {
 const dir = join(scratch, String(++sequence)); mkdirSync(dir)
 writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 'native-windows-owner-fixture', private: true, xplat: { targets: { web: {} } } }))
 const paths = call({ operation: 'paths', root: dir }); directories.add(paths.directory)
 return { dir, paths }
}
function remember(fixture) {
 const descriptor = JSON.parse(readFileSync(fixture.paths.descriptor, 'utf8'))
 owned.set(fixture.dir, { ...fixture, descriptor }); return descriptor
}
function rpc(fixture, descriptor, method, params = {}, token = descriptor.token) {
 return new Promise((resolve, reject) => {
  const peer = createConnection(fixture.paths.socket)
  let output = '', settled = false
  const timer = setTimeout(() => finish(Error('Windows owner RPC deadline')), 5000)
  function finish(error, value) {
   if (settled) {return}
   settled = true; clearTimeout(timer); peer.destroy()
   if (error) {reject(error)} else {resolve(value)}
  }
  peer.once('error', error => finish(error)); peer.once('end', () => finish(Error('Owner ended before its reply')))
  peer.once('connect', () => peer.write(JSON.stringify({ token, method, params })+'\n'))
  peer.on('data', bytes => {
   output += bytes
   if (output.includes('\n')) {try {finish(null, JSON.parse(output.split('\n')[0]))} catch (error) {finish(error)}}
  })
 })
}
async function stopChild(child) {
 if (child.exitCode !== null || child.signalCode !== null) {return}
 const closed = new Promise(resolve => child.once('close', resolve))
 child.kill('SIGKILL'); await closed
}
function alive(pid) {try {process.kill(pid, 0); return true} catch (error) {if (error.code === 'ESRCH') {return false}; throw error}}
async function until(predicate, message, timeout = 6000) {
 const end = Date.now()+timeout
 while (!predicate() && Date.now()<end) {await delay(10)}
 assert.ok(predicate(), message)
}
async function shutdown(fixture, descriptor) {
 if (alive(descriptor.pid)) {assert.equal((await rpc(fixture, descriptor, 'host.shutdown')).ok, true)}
 await until(() => !alive(descriptor.pid), 'Exact test owner must exit after authenticated shutdown')
 owned.delete(fixture.dir)
 assert.equal(existsSync(fixture.paths.descriptor), false)
}
after(async () => {
 try {
  for (const fixture of owned.values()) {await shutdown(fixture, fixture.descriptor)}
 } finally {
  for (const child of children) {await stopChild(child)}
  for (const pid of guests) {await until(() => !alive(pid), 'Self-terminating owned fixture must exit before cleanup', 12000)}
  if (windows) {
   writeFileSync(join(work, 'host-windows-evidence.json'), JSON.stringify(evidence, null, 2)+'\n')
   for (const directory of directories) {rmSync(directory, { recursive: true, force: true })}
   rmSync(scratch, { recursive: true, force: true })
  }
 }
})

test('Windows read-only public clients preserve absent owner/cache state', host, () => {
 const f = fixture()
 assert.equal(call({ operation: 'connect', root: f.dir }).absent, true)
 const result = spawnSync(binary, ['session','list','--project',f.dir,'--json'], { encoding: 'utf8', env: environment, timeout: 8000 })
 assert.equal(result.status, 0, result.stderr)
 assert.deepEqual(JSON.parse(result.stdout).data, { sessions: [] })
 assert.equal(existsSync(f.paths.directory), false)
})
test('Windows concurrent clients publish one private same-executable owner with empty PATH', host, async () => {
 const f = fixture()
 const replies = await Promise.all(Array.from({ length: 6 }, () => concurrent({ operation: 'ensure', root: f.dir })))
 const descriptor = remember(f)
 assert.ok(replies.every(value => value.ok && value.pid === descriptor.pid), JSON.stringify(replies))
 assert.match(f.paths.socket, /^\\\\\.\\pipe\\octane-xplat-nim-/)
 assert.equal(call({ operation: 'connect', root: f.dir }).pid, descriptor.pid)
 assert.ok(!readFileSync(join(f.paths.directory, 'host.log'), 'utf8').includes(descriptor.token))
 await shutdown(f, descriptor)
})
test('Windows token validation and shutdown/restart preserve native owner generations', host, async () => {
 const f = fixture(); assert.equal(call({ operation: 'ensure', root: f.dir }).ok, true)
 const old = remember(f)
 const denied = await rpc(f, old, 'host.ping', {}, 'wrong-fixture-token')
 assert.equal(denied.error.code, 'permission_denied')
 assert.equal((await rpc(f, old, 'host.ping')).result.pid, old.pid)
 await shutdown(f, old)
 assert.equal(call({ operation: 'ensure', root: f.dir }).ok, true)
 const current = remember(f)
 assert.notEqual(current.pid, old.pid); assert.notEqual(current.token, old.token)
 assert.equal((await rpc(f, current, 'host.ping', {}, old.token)).error.code, 'permission_denied')
 await shutdown(f, current)
})
test('Windows fixture jobs cancel real child and descendant handles before host reuse', host, async () => {
 const f = fixture(); assert.equal(call({ operation: 'ensure', root: f.dir }).ok, true)
 const descriptor = remember(f), marker = join(f.dir, 'worker.json')
 const unrelated = spawn(process.execPath, ['-e','setTimeout(()=>{},30000)'], { stdio: 'ignore' }); children.add(unrelated)
 try {
  const started = await rpc(f, descriptor, 'fixture.start', { marker })
  assert.equal(started.ok, true, JSON.stringify(started))
  await until(() => existsSync(marker) && existsSync(marker+'.descendant'), 'Worker and descendant must both be armed')
  const child = JSON.parse(readFileSync(marker)), descendant = JSON.parse(readFileSync(marker+'.descendant'))
  assert.ok(alive(child.pid) && alive(descendant.pid))
  assert.equal((await rpc(f, descriptor, 'jobs.cancel', { jobId: started.result.job.jobId })).ok, true)
  await until(() => !alive(child.pid) && !alive(descendant.pid), 'Job cancellation must release both actual kernel identities')
  assert.equal(alive(unrelated.pid), true)
  assert.equal((await rpc(f, descriptor, 'host.ping')).ok, true)
  evidence.push({ operation: 'fixture-job-release', child: child.pid, descendant: descendant.pid, unrelatedPreserved: true })
 } finally {await stopChild(unrelated); children.delete(unrelated); await shutdown(f, descriptor)}
})
test('Windows production entry runs authenticated owner RPC and public clients without Node on PATH', host, async () => {
 const f = fixture()
 const ready = call({ operation: 'ensure', root: f.dir, executable: binary })
 assert.equal(ready.ok, true, JSON.stringify(ready))
 const descriptor = remember(f)
 assert.equal(descriptor.identity.name, '@octane-xplat/cli')
 const result = spawnSync(binary, ['session','list','--project',f.dir,'--json'], { encoding: 'utf8', env: environment, timeout: 8000 })
 assert.equal(result.status, 0, result.stderr)
 assert.deepEqual(JSON.parse(result.stdout).data, { sessions: [] })
 await shutdown(f, descriptor)
})

test('Windows detached owner handoff preserves literal argv, private append logs and noninherited locks', host, async () => {
 const f = fixture(), privateDir = join(f.dir, 'private launch π😀')
 assert.equal(call({ operation: 'private-directory', path: privateDir }).ok, true)
 const marker = join(privateDir, 'identity.json'), log = join(privateDir, 'host.log'), lock = join(privateDir, 'held.lock')
 const literal = ['space π😀', 'quoted "value"', '', 'tail\\']
 for (let i = 0; i < 2; i++) {
  rmSync(marker, { force: true })
  const reply = await concurrent({ operation: 'launch', command: probe, cwd: f.dir, log, lockPath: lock,
   env: { SystemRoot: process.env.SystemRoot, '=C:': f.dir, '=Z:': privateDir, PATH: '', XPLAT_HOST_FIXTURE: 'native 🛰️ standalone', XPLAT_NIM_BOOTSTRAP_JOB: 'invalid-inherited-value' } },
   parent => ['identity', marker, String(parent), lock, '700', 'ignore', '', '700', ...literal])
  assert.equal(reply.ok, true, JSON.stringify(reply)); guests.add(reply.pid); assert.equal(reply.finished, false)
  await until(() => existsSync(marker), 'Detached owner must run after its invoking client exits')
  const value = JSON.parse(readFileSync(marker))
  assert.equal(value.pid, reply.pid); assert.equal(value.guardAdopted, true)
  assert.equal(value.bootstrapEnvironmentCleared, true); assert.equal(value.stdinIsNull, true)
  assert.equal(value.lockAcquired, true, 'The invoking lifetime lock handle must not leak to the owner')
  assert.deepEqual(value.driveDirectories, { '=C:': f.dir, '=Z:': privateDir })
  assert.equal(value.sentinel, 'native 🛰️ standalone'); assert.equal(value.cwd, f.dir)
  assert.deepEqual(value.argv.slice(8), literal)
  await until(() => !alive(reply.pid), 'Self-terminating owner must release its job')
 }
 const contents = readFileSync(log, 'utf8')
 assert.equal(contents.split('fixture stdout').length-1, 2)
 assert.equal(contents.split('fixture stderr').length-1, 2)
})
test('Windows unpublished cancellation awaits the root job, including descendants', host, async () => {
 const f = fixture(), privateDir = join(f.dir, 'cancel-launch')
 assert.equal(call({ operation: 'private-directory', path: privateDir }).ok, true)
 const marker = join(privateDir, 'root.json'), descendant = marker+'.descendant'
 const reply = call({ operation: 'launch', command: probe, cwd: f.dir, log: join(privateDir, 'host.log'),
  args: ['identity', marker, '0', '', '10000', 'ignore', descendant, '10000'], marker: descendant, stop: true, env: { SystemRoot: process.env.SystemRoot } })
 assert.equal(reply.ok, true, JSON.stringify(reply)); assert.equal(reply.finished, true)
 assert.equal(reply.exitCode, 1); assert.equal(alive(reply.pid), false)
 assert.equal(alive(JSON.parse(readFileSync(descendant)).pid), false)
})
test('Windows abrupt root exit closes its sole job keeper and kills a longer-lived descendant', host, async () => {
 const f = fixture(), privateDir = join(f.dir, 'root-exit')
 assert.equal(call({ operation: 'private-directory', path: privateDir }).ok, true)
 const marker = join(privateDir, 'root.json'), descendant = marker+'.descendant'
 const reply = call({ operation: 'launch', command: probe, cwd: f.dir, log: join(privateDir, 'host.log'),
  args: ['identity', marker, '0', '', '800', 'crash', descendant, '8000'], env: { SystemRoot: process.env.SystemRoot } })
 assert.equal(reply.ok, true, JSON.stringify(reply)); guests.add(reply.pid)
 await until(() => existsSync(descendant), 'Long-lived descendant must become armed')
 const child = JSON.parse(readFileSync(descendant)); guests.add(child.pid)
 assert.equal(child.bootstrapEnvironmentCleared, true); assert.equal(child.guardAdopted, false)
 assert.ok(alive(child.pid))
 await until(() => !alive(reply.pid) && !alive(child.pid), 'Root exit must release both exact owned identities', 4000)
 evidence.push({ operation: 'abrupt-root-exit-job-cleanup', root: reply.pid, descendant: child.pid, passed: true })
})
test('Windows bootstrap preflight rejects unsafe argv and broad logs without changing user files', host, () => {
 const f = fixture(), privateDir = join(f.dir, 'invalid-launch')
 assert.equal(call({ operation: 'private-directory', path: privateDir }).ok, true)
 const log = join(privateDir, 'host.log')
 for (const invalid of [{ command: 'relative-command' }, { cwd: 'relative-cwd' }, { args: ['bad\0argument'] },
  { env: { 'bad=key': 'value' } }, { env: { key: 'bad\0value' } }]) {
  const reply = call({ operation: 'launch', command: probe, args: [], cwd: f.dir, log, env: {}, ...invalid })
  assert.equal(reply.ok, false); assert.equal(existsSync(log), false)
 }
 const broad = join(f.dir, 'user-log.txt'); writeFileSync(broad, 'preserve user log')
 const reply = call({ operation: 'launch', command: probe, args: [], cwd: f.dir, log: broad, env: {} })
 assert.equal(reply.ok, false); assert.equal(readFileSync(broad, 'utf8'), 'preserve user log')
})
