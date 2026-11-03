import { test, after } from 'node:test'
import assert from 'node:assert/strict'
import { spawn, spawnSync } from 'node:child_process'
import { createConnection, createServer } from 'node:net'
import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync, renameSync, statSync, unlinkSync, symlinkSync, realpathSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { homedir } from 'node:os'
import { join, resolve, dirname } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { scratchRun } from './scratch.mjs'
import { assertCurrentNativeBuild, hostProbeInputs } from './native-inputs.mjs'
const root = resolve(import.meta.dirname, '../..')
const suffix = process.platform === 'win32' ? '.exe' : ''
const probe = join(root, 'research/nim-cli/native/host-probe'+suffix)
const binary = join(root, 'research/nim-cli/native/xplat'+suffix)
assertCurrentNativeBuild(root, JSON.parse(readFileSync(join(root, 'research/nim-cli/native/host-build.json'))), readFileSync(probe), hostProbeInputs)
assertCurrentNativeBuild(root, JSON.parse(readFileSync(join(root, 'research/nim-cli/native/build.json'))), readFileSync(binary))
const scratch = scratchRun(root, 'host-integration'), owned = new Map(), runtimeDirectories = new Set()
const macOnly = { skip: process.platform !== 'darwin', timeout: 20000 }
let sequence = 0
function fixture() {
 const dir = join(scratch, String(++sequence))
 mkdirSync(dir)
 writeFileSync(join(dir, 'package.json'), JSON.stringify({private:true,xplat:{targets:{macos:{runtime:'appkit-node-api'}}}}))
 return dir
}
function call(request, extraEnv = {}) {
 const child = spawnSync(probe, [], { input: JSON.stringify(request)+'\n', encoding: 'utf8', cwd: root,
  env: { ...process.env, PATH: '', XPLAT_AGENT_HOST_IDLE_MS: '1000', ...extraEnv }, timeout: 12000, killSignal: 'SIGKILL' })
 assert.equal(child.status, 0, child.stderr || child.error?.message)
 return JSON.parse(child.stdout)
}
function concurrent(request) {
 return new Promise((resolve, reject) => {
  const child = spawn(probe, [], { env: { ...process.env, PATH: '', XPLAT_AGENT_HOST_IDLE_MS: '1000' }, stdio: ['pipe','pipe','pipe'] })
  let output = '', errors = ''
  child.stdout.on('data', bytes => { output += bytes })
  child.stderr.on('data', bytes => { errors += bytes })
  child.once('error', reject)
  child.once('close', code => {
   try { assert.equal(code, 0, errors); resolve(JSON.parse(output)) } catch (error) { reject(error) }
  })
  child.stdin.end(JSON.stringify(request)+'\n')
 })
}
const paths = dir => {
 const p = call({ operation: 'paths', root: dir })
 const key = createHash('sha256').update(realpathSync(dir)).digest('hex').slice(0,32)
 assert.equal(p.directory, join(homedir(), '.cache/octane-xplat/nim-hosts', key))
 runtimeDirectories.add(p.directory)
 return p
}
const descriptor = p => JSON.parse(readFileSync(p.descriptor, 'utf8'))
function remember(dir) {
 const p = paths(dir), d = descriptor(p)
 owned.set(dir, { p, d })
 return { p, d }
}
const alive = pid => { try { process.kill(pid, 0); return true } catch (error) { if (error.code === 'ESRCH') {return false} throw error } }
async function until(predicate, text, timeout = 6000) {
 const end = Date.now()+timeout
 while (!predicate() && Date.now()<end) {await delay(10)}
 assert.ok(predicate(), text)
}
function rpc(p, d, method, params = {}, token = d.token) {
 return new Promise((resolve, reject) => {
  const socket = createConnection(p.socket)
  const timer = setTimeout(() => { socket.destroy(); reject(Error('RPC deadline')) }, 5000)
  let output = ''
  socket.once('error', reject)
  socket.once('close', () => clearTimeout(timer))
  socket.once('connect', () => socket.write(JSON.stringify({ token, method, params })+'\n'))
  socket.on('data', bytes => {
   output += bytes
   if (output.includes('\n')) {
    socket.destroy()
    try { resolve(JSON.parse(output.split('\n')[0])) } catch (error) { reject(error) }
   }
  })
 })
}
function cli(dir, args) {
 const child = spawnSync(binary, [...args, '--project', dir, '--json'], { encoding: 'utf8', env: { ...process.env, PATH: '' }, timeout: 8000, killSignal: 'SIGKILL' })
 return { code: child.status, value: JSON.parse(child.stdout) }
}
after(async () => {
 for (const { p, d } of owned.values()) {
  if (alive(d.pid)) { try { await rpc(p,d,'host.shutdown') } catch {} }
  await until(() => !alive(d.pid), 'Test-owned native host must terminate', 8000)
 }
 for (const directory of runtimeDirectories) {rmSync(directory, { recursive: true, force: true })}
 rmSync(scratch, { recursive: true, force: true })
})

test('read-only public session/job commands do not create a host or its cache', macOnly, () => {
 const dir = fixture(), p = paths(dir)
 assert.equal(call({ operation: 'connect', root: dir }).absent, true)
 const empty = cli(dir, ['session','list'])
 assert.equal(empty.code, 0)
 assert.deepEqual(empty.value.data, { sessions: [] })
 for (const args of [['session','status','missing'], ['session','end','missing'], ['job','status','missing'], ['job','cancel','missing']]) {
  const reply = cli(dir,args)
  assert.equal(reply.code, 2)
  assert.equal(reply.value.error.code, 'not_found')
 }
 assert.equal(existsSync(p.directory), false)
})

test('concurrent native invocations converge on a private same-executable host with PATH empty', macOnly, async () => {
 const dir = fixture()
 const replies = await Promise.all(Array.from({ length: 6 }, () => concurrent({ operation: 'ensure', root: dir })))
 const { p, d } = remember(dir)
 assert.ok(replies.every(reply => reply.ok && reply.pid === d.pid))
 assert.equal(statSync(p.directory).mode & 0o777, 0o700)
 assert.equal(statSync(p.descriptor).mode & 0o777, 0o600)
 assert.equal(statSync(p.socket).mode & 0o777, 0o600)
 assert.equal(statSync(join(p.directory,'host.log')).mode & 0o777, 0o600)
 assert.ok(!readFileSync(join(p.directory,'host.log'),'utf8').includes(d.token), 'Private tokens must not appear in diagnostics')
 const alias = join(scratch, 'alias')
 symlinkSync(dir, alias, 'dir')
 assert.equal(call({ operation: 'connect', root: alias }).pid, d.pid)
 await until(() => !alive(d.pid), 'An idle host must exit')
 assert.equal(existsSync(p.descriptor), false)
 assert.equal(existsSync(p.socket), false)
 assert.equal(existsSync(p.lock), true)
})

test('token authentication and request validation preserve a usable native host', macOnly, async () => {
 const dir = fixture()
 assert.equal(call({ operation: 'ensure', root: dir }).ok, true)
 const { p, d } = remember(dir)
 assert.equal((await rpc(p,d,'host.ping',{},'wrong')).error.code, 'permission_denied')
 assert.equal((await rpc(p,d,'unknown')).error.code, 'invalid_selection')
 assert.equal((await rpc(p,d,'host.ping',[])).error.code, 'invalid_selection')
 assert.equal((await rpc(p,d,'host.ping')).result.workspaceRoot, dir)
 assert.equal((await rpc(p,d,'host.shutdown')).ok, true)
 await until(() => !alive(d.pid), 'Authenticated shutdown must finish')
})

test('cross-invocation jobs and sessions survive idle time and cancellation reaps the armed child', macOnly, async () => {
 const dir = fixture(), marker = join(dir,'child.json')
 assert.equal(call({ operation: 'ensure', root: dir }).ok, true)
 const { d } = remember(dir)
 const started = call({ operation: 'call', root: dir, method: 'fixture.start', params: { marker } })
 assert.equal(started.ok, true)
 const job = started.result.job.jobId, session = started.result.session.sessionId
 await until(() => existsSync(marker) && existsSync(marker+'.descendant'), 'Observe the native child and descendant before exercising cancellation')
 const childInfo = JSON.parse(readFileSync(marker))
 const child = childInfo.pid
 const descendant = JSON.parse(readFileSync(marker+'.descendant'))
 assert.equal(descendant.group, childInfo.group)
 await delay(1300)
 assert.equal(alive(d.pid), true)
 assert.equal(cli(dir,['job','status',job]).value.data.job.state, 'running')
 assert.equal(cli(dir,['session','status',session]).value.data.session.sessionId, session)
 assert.equal(cli(dir,['session','list']).value.data.sessions.length, 1)
 assert.equal(cli(dir,['job','cancel',job]).value.ok, true)
 await until(() => cli(dir,['job','status',job]).value.data.job.state === 'cancelled', 'Job cancellation must settle')
 await until(() => !alive(child) && !alive(descendant.pid), 'Cancellation must release the child and descendant before outer test cleanup')
 const ended = cli(dir,['session','end',session])
 assert.equal(ended.value.data.result.ended, true)
 assert.deepEqual(ended.value.data.result.released, ['fixture process'])
 await until(() => !alive(d.pid), 'No retained live work should keep an idle host running')
})

test('a crashed native host is replaced without signalling a PID from its stale descriptor', macOnly, async () => {
 const dir = fixture()
 assert.equal(call({ operation: 'ensure', root: dir }).ok, true)
 const before = remember(dir)
 process.kill(before.d.pid, 'SIGKILL') // Test-created, authenticated daemon; no application resources.
 await until(() => !alive(before.d.pid), 'The disposable daemon must be gone before stale recovery')
 assert.equal(existsSync(before.p.socket), true)
 assert.equal(call({ operation: 'ensure', root: dir }).ok, true)
 const next = remember(dir)
 assert.notEqual(next.d.pid, before.d.pid)
 assert.equal((await rpc(next.p,next.d,'host.shutdown')).ok, true)
 await until(() => !alive(next.d.pid), 'Replacement host must stop')
})

test('session end cancels its live job before completing owned process cleanup', macOnly, async () => {
 const dir = fixture(), marker = join(dir,'end-child.json')
 assert.equal(call({ operation: 'ensure', root: dir }).ok, true)
 remember(dir)
 const started = call({ operation: 'call', root: dir, method: 'fixture.start', params: { marker } }).result
 await until(() => existsSync(marker+'.descendant'), 'Arm both processes before ending the session')
 const child = JSON.parse(readFileSync(marker)).pid, descendant = JSON.parse(readFileSync(marker+'.descendant')).pid
 const ended = cli(dir,['session','end',started.session.sessionId])
 assert.equal(ended.value.data.result.ended, true)
 assert.equal(cli(dir,['job','status',started.job.jobId]).value.data.job.state, 'cancelled')
 await until(() => !alive(child) && !alive(descendant), 'Session end must complete owned cleanup')
})

test('shutdown releases live work and preserves replaced descriptor and socket identities', macOnly, async () => {
 const dir = fixture(), marker = join(dir,'shutdown-child.json')
 assert.equal(call({ operation: 'ensure', root: dir }).ok, true)
 const { p, d } = remember(dir)
 assert.equal(call({ operation: 'call', root: dir, method: 'fixture.start', params: { marker } }).ok, true)
 await until(() => existsSync(marker+'.descendant'), 'Arm processes before host shutdown')
 const child = JSON.parse(readFileSync(marker)).pid, descendant = JSON.parse(readFileSync(marker+'.descendant')).pid
 const socket = createConnection(p.socket)
 await new Promise((resolve, reject) => { socket.once('connect',resolve); socket.once('error',reject) })
 const reply = new Promise((resolve, reject) => {
  const timer = setTimeout(() => reject(Error('Shutdown reply deadline')), 5000)
  let bytes = ''
  socket.on('data', chunk => { bytes += chunk; if (bytes.includes('\n')) { clearTimeout(timer); resolve(JSON.parse(bytes.split('\n')[0])); socket.destroy() } })
  socket.once('error', reject)
 })
 reply.catch(() => {})
 try {
  const replacement = join(dir,'replacement.json')
  writeFileSync(replacement, 'preserve descriptor replacement', { mode: 0o600 })
  renameSync(replacement,p.descriptor)
  renameSync(p.socket,join(dir,'original.sock'))
  writeFileSync(p.socket,'preserve socket replacement', { mode: 0o600 })
  socket.write(JSON.stringify({ token: d.token, method: 'host.shutdown', params: {} })+'\n')
  assert.equal((await reply).ok,true)
  await until(() => !alive(d.pid) && !alive(child) && !alive(descendant), 'Shutdown must finish all owned work')
  assert.equal(readFileSync(p.descriptor,'utf8'),'preserve descriptor replacement')
  assert.equal(readFileSync(p.socket,'utf8'),'preserve socket replacement')
 } finally {
  if (!socket.destroyed) {socket.write(JSON.stringify({ token: d.token, method: 'host.shutdown', params: {} })+'\n')}
  await reply.catch(() => {})
  if (existsSync(p.socket) && statSync(p.socket).isFile() && readFileSync(p.socket,'utf8') === 'preserve socket replacement') {unlinkSync(p.socket)}
 }
})

test('startup preserves foreign live listeners, regular files and unrecognized descriptors', macOnly, async () => {
 const dir = fixture(), p = paths(dir)
 mkdirSync(p.directory,{ recursive: true, mode: 0o700 })
 mkdirSync(dirname(p.socket),{ recursive: true, mode: 0o700 })
 const server = createServer(socket => socket.destroy())
 await new Promise((resolve, reject) => { server.once('error',reject); server.listen(p.socket,resolve) })
 try {
  assert.equal(call({ operation: 'ensure', root: dir, timeoutMs: 300 }).ok,false)
  assert.equal(server.listening,true)
  assert.equal(existsSync(p.socket),true)
  assert.equal(existsSync(p.descriptor),false)
 } finally { await new Promise(resolve => server.close(resolve)) }
 writeFileSync(p.socket,'foreign regular file',{ mode: 0o600 })
 try {
  assert.equal(call({ operation: 'ensure', root: dir, timeoutMs: 300 }).ok,false)
  assert.equal(readFileSync(p.socket,'utf8'),'foreign regular file')
 } finally { unlinkSync(p.socket) }
 writeFileSync(p.descriptor,'user-owned foreign contents',{ mode: 0o600 })
 assert.equal(call({ operation: 'ensure', root: dir, timeoutMs: 300 }).ok,false)
 assert.equal(readFileSync(p.descriptor,'utf8'),'user-owned foreign contents')
})

test('private descriptor and launch-log validation cannot block opening a FIFO', macOnly, () => {
 for (const name of ['host.json','host.log']) {
  const dir = fixture(), p = paths(dir)
  mkdirSync(p.directory,{ recursive: true, mode: 0o700 })
  const path = join(p.directory,name)
  assert.equal(spawnSync('mkfifo',[path]).status,0)
  const reply = call({ operation: 'ensure', root: dir, timeoutMs: 300 })
  assert.equal(reply.ok,false)
  assert.equal(statSync(path).isFIFO(),true)
 }
})

test('clean and dependency replacement preserve discovery of a live native owner', macOnly, async () => {
 const dir = fixture(), marker = join(dir,'clean-child.json')
 assert.equal(call({ operation: 'ensure', root: dir }).ok,true)
 remember(dir)
 const started = call({ operation: 'call', root: dir, method: 'fixture.start', params: { marker } }).result
 await until(() => existsSync(marker+'.descendant'), 'Arm resources before deleting disposable project caches')
 mkdirSync(join(dir,'node_modules/.cache/xplat'),{ recursive: true })
 writeFileSync(join(dir,'node_modules/.cache/xplat/disposable'),'cache')
 const cleaned = spawnSync(binary,['clean'],{ cwd: dir, encoding:'utf8', env: { ...process.env, PATH:'' }, timeout:5000 })
 assert.equal(cleaned.status,0,cleaned.stderr)
 assert.equal(existsSync(join(dir,'node_modules/.cache/xplat')),false)
 assert.equal(cli(dir,['job','status',started.job.jobId]).value.data.job.state,'running')
 rmSync(join(dir,'node_modules'),{ recursive: true, force: true })
 assert.equal(cli(dir,['session','status',started.session.sessionId]).value.data.session.sessionId,started.session.sessionId)
 assert.equal(cli(dir,['session','end',started.session.sessionId]).value.data.result.ended,true)
})
