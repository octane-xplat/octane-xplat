import { test, after } from 'node:test'
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync, statSync, symlinkSync, realpathSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { scratchRun } from './scratch.mjs'
import { assertCurrentNativeBuild, hostProbeInputs } from './native-inputs.mjs'
const root = resolve(import.meta.dirname, '../..')
const binary = join(root, `research/nim-cli/native/host-probe${process.platform === 'win32' ? '.exe' : ''}`)
assertCurrentNativeBuild(root, JSON.parse(readFileSync(join(root, 'research/nim-cli/native/host-build.json'))), readFileSync(binary), hostProbeInputs)
const scratch = scratchRun(root, 'bootstrap'), holders = new Set(), guests = new Set()
const macOnly = { skip: process.platform !== 'darwin' }
let sequence = 0
function fixture() {
 const dir = join(scratch, String(++sequence))
 mkdirSync(dir)
 return { dir, lock: join(dir, 'host.lock'), log: join(dir, 'host.log'), marker: join(dir, 'marker.json') }
}
function probe(request, argumentsForPid) {
 const child = spawn(binary, [], { cwd: root, stdio: ['pipe', 'pipe', 'pipe'] })
 let stdout = '', stderr = '', resolveReady, rejectReady
 const ready = new Promise((resolve, reject) => { resolveReady = resolve; rejectReady = reject })
 ready.catch(() => {})
 const closed = new Promise((resolve, reject) => {
  child.once('error', reject)
  child.once('close', (code, signal) => {
   rejectReady(Error(stderr || 'Holder did not start'))
   resolve({ code, signal, stdout, stderr })
  })
 })
 child.stdout.on('data', bytes => {
  stdout += bytes
  if (stdout.includes('\n')) {
   try { resolveReady(JSON.parse(stdout.split('\n')[0])) } catch (error) { rejectReady(error) }
  }
 })
 child.stderr.on('data', bytes => { stderr += bytes })
 child.stdin.end(JSON.stringify({ ...request, ...(argumentsForPid ? { args: argumentsForPid(child.pid) } : {}) }) + '\n')
 const holder = { child, ready, closed }
 holders.add(holder)
 closed.finally(() => holders.delete(holder)).catch(() => {})
 return holder
}
async function run(request, argumentsForPid) {
 const holder = probe(request, argumentsForPid)
 const closed = await holder.closed
 assert.equal(closed.code, 0, closed.stderr)
 assert.equal(closed.signal, null)
 assert.equal(closed.stderr, '')
 return { value: JSON.parse(closed.stdout), parentPid: holder.child.pid }
}
async function stop(holder) {
 if (holder.child.exitCode === null && holder.child.signalCode === null) holder.child.kill('SIGTERM')
 return await holder.closed
}
const alive = pid => { try { process.kill(pid, 0); return true } catch (error) { if (error.code === 'ESRCH') return false; throw error } }
async function waitFor(condition, description, timeoutMs = 6000) {
 const deadline = Date.now() + timeoutMs
 while (!condition() && Date.now() < deadline) await delay(5)
 assert.ok(condition(), description)
}
after(async () => {
 for (const holder of holders) await stop(holder)
 for (const pid of guests) await waitFor(() => !alive(pid), 'The self-terminating native fixture must exit', 7000)
 rmSync(scratch, { recursive: true, force: true })
})

test('lifetime lock excludes another process and keeps a reusable inode after release', macOnly, async () => {
 const f = fixture(), holder = probe({ operation: 'lock', path: f.lock, hold: true })
 try {
  assert.equal((await holder.ready).acquired, true)
  assert.equal(statSync(f.lock).mode & 0o777, 0o600)
  const inode = statSync(f.lock).ino
  assert.deepEqual((await run({ operation: 'lock', path: f.lock })).value, { ok: true, acquired: false })
  assert.equal((await stop(holder)).code, 0)
  assert.deepEqual((await run({ operation: 'lock', path: f.lock })).value, { ok: true, acquired: true })
  assert.equal(statSync(f.lock).ino, inode)
 } finally { await stop(holder) }
})

test('lock and log paths reject symlinks and unsafe existing files without changing user data', macOnly, async () => {
 const f = fixture(), original = join(f.dir, 'user.txt'), link = join(f.dir, 'link')
 writeFileSync(original, 'preserve me', { mode: 0o644 })
 symlinkSync(original, link)
 for (const path of [original, link, f.dir]) {
  const result = (await run({ operation: 'lock', path })).value
  assert.equal(result.ok, false)
 }
 const log = (await run({ operation: 'launch', command: binary, args: [], cwd: f.dir, log: link, env: {} })).value
 assert.equal(log.ok, false)
 assert.equal(readFileSync(original, 'utf8'), 'preserve me')
 assert.equal(statSync(original).mode & 0o777, 0o644)
})

test('same native executable survives its launcher with isolated session, stdio, cwd and environment', macOnly, async () => {
 for (const closeStdin of [false, true]) {
  const f = fixture(), cwd = join(f.dir, 'project with spaces')
  mkdirSync(cwd)
  const { value, parentPid } = await run({ operation: 'launch', command: binary, cwd, log: f.log, lockPath: f.lock,
   closeStdin, env: { PATH: '', XPLAT_HOST_FIXTURE: 'native 🛰️ standalone' } },
  parent => ['identity', f.marker, String(parent), f.lock, '3000'])
  assert.equal(value.ok, true, value.message)
  guests.add(value.pid)
  assert.equal(value.parentCwdPreserved, true)
  assert.equal(value.finished, false)
  await waitFor(() => existsSync(f.marker), 'Native daemon must publish its observed identity')
  const marker = JSON.parse(readFileSync(f.marker))
  assert.equal(marker.pid, value.pid)
  assert.notEqual(marker.parent, parentPid)
  assert.equal(marker.session, marker.pid)
  assert.equal(marker.group, marker.pid)
  assert.equal(marker.stdinIsNull, true)
  assert.equal(marker.lockAcquired, true, 'The launcher lock must not leak through exec')
  assert.equal(marker.cwd, realpathSync(cwd))
  assert.equal(marker.sentinel, 'native 🛰️ standalone')
  assert.equal(alive(value.pid), true, 'Launcher exit must preserve the detached daemon')
  await waitFor(() => readFileSync(f.log, 'utf8').includes('fixture stderr'), 'Both daemon streams must be redirected')
  assert.match(readFileSync(f.log, 'utf8'), /fixture stdout/)
  assert.equal(statSync(f.log).mode & 0o777, 0o600)
 }
})

test('unpublished startup can be stopped and reaped without signalling a reused descriptor PID', macOnly, async () => {
 const f = fixture()
 const { value } = await run({ operation: 'launch', command: binary, args: ['identity', f.marker, '0', '', '10000', 'ignore'],
  cwd: f.dir, log: f.log, marker: f.marker, stop: true, env: {} })
 assert.equal(value.ok, true, value.message)
 assert.ok(existsSync(f.marker), 'Observe the fixture running before termination')
 assert.equal(value.finished, true)
 assert.equal(value.exitCode, 137)
 assert.equal(alive(value.pid), false)
})

test('invalid arguments fail before log creation and empty native ownership handles are harmless', macOnly, async () => {
 const f = fixture()
 for (const invalid of [
  { command: 'relative-command' }, { cwd: 'relative-project' }, { args: ['bad\0argument'] },
  { env: { 'bad=key': 'value' } }, { env: { key: 'bad\0value' } },
 ]) {
  const result = (await run({ operation: 'launch', command: binary, args: [], cwd: f.dir, log: f.log, env: {}, ...invalid })).value
  assert.equal(result.ok, false)
  assert.equal(existsSync(f.log), false)
 }
 assert.deepEqual((await run({ operation: 'empty-handles' })).value, { ok: true, safe: true })
})
