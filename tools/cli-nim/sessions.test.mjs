import { test, after } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, rmSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { join, resolve } from 'node:path'
import { assertCurrentNativeBuild, envProbeInputs } from './native-inputs.mjs'
import { scratchRun } from './scratch.mjs'
const root = resolve(import.meta.dirname, '../..')
const binary = join(root, `research/nim-cli/native/env-probe${process.platform === 'win32' ? '.exe' : ''}`)
assertCurrentNativeBuild(root, JSON.parse(readFileSync(join(root, 'research/nim-cli/native/env-build.json'))), readFileSync(binary), envProbeInputs)
const scratch = scratchRun(root, 'sessions')
after(() => rmSync(scratch, { recursive: true, force: true }))
const input = (sessionId, extra = {}) => ({ appId: '.', platform: 'web', targetId: 'web', sessionId, ...extra })
function normalize(value) {
 if (Array.isArray(value)) {return value.map(normalize)}
 if (value && typeof value === 'object') {return Object.fromEntries(Object.entries(value).map(([key, item]) => {
  if (key === 'createdAt') {
   assert.match(item, /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/)
   assert.ok(Math.abs(Date.parse(item) - Date.now()) < 60000)
   return [key, '<current-utc>']
  }
  return [key, normalize(item)]
 }))}
 return value
}
function query(steps, native = true, extra = {}) {
 const run = spawnSync(native ? binary : process.execPath, native ? [] : [join(import.meta.dirname, 'sessions-reference.mjs')],
  { input: JSON.stringify({ operation: 'sessions', dir: scratch, steps, ...extra }) + '\n', encoding: 'utf8', timeout: 10000 })
 assert.equal(run.status, 0, run.stderr)
 assert.equal(run.stderr, '')
 const result = JSON.parse(run.stdout)
 assert.equal(result.ok, true, result.message)
 return result.value
}
function parity(steps) {
 const actual = query(steps), expected = query(steps, false)
 assert.deepEqual(normalize(actual), normalize(expected))
 return actual
}

test('session states, progress, usability, notifications and owned/attached cleanup follow the reference', () => {
 const result = parity([
  { op: 'get', id: 'missing' }, { op: 'usable', id: 'missing' },
  { op: 'bind', input: input('one'), cleanup: { released: ['process'], delayMs: 5 } },
  { op: 'attach', input: input('user', { processKind: 'existing', buildIdentity: { label: 'user build' } }) },
  { op: 'usable', id: 'one' }, { op: 'launch', id: 'one', progress: { phase: 'building', count: 1 } },
  { op: 'launch', id: 'one', progress: { phase: 'starting' } },
  { op: 'ready', id: 'one', meta: { processKind: 'fresh', buildIdentity: { revision: 'abc' } } },
  { op: 'disconnect', id: 'one', detail: 'device unplugged' }, { op: 'usable', id: 'one' },
  { op: 'disconnect', id: 'one', detail: null }, { op: 'ready', id: 'one' },
  { op: 'end', id: 'user' }, { op: 'end', id: 'one' }, { op: 'usable', id: 'one' },
  { op: 'ready', id: 'one' }, { op: 'disconnect', id: 'one' }, { op: 'launch', id: 'one', progress: { phase: 'ignored' } },
  { op: 'fail', id: 'one', error: { code: 'execution_failure', message: 'ignored after stop' } },
  { op: 'end', id: 'missing' }, { op: 'list' },
 ])
 assert.deepEqual(result.cleanupCalls, ['one'])
})

test('failed sessions retain honest historical state and cleanup failures stay visible', () => {
 parity([
  { op: 'bind', input: input('one'), cleanup: { fail: true } },
  { op: 'launch', id: 'one', progress: { phase: 'building', detail: 'first' } },
  { op: 'fail', id: 'one', error: { code: 'execution_failure', message: 'compiler failed' } },
  { op: 'usable', id: 'one' }, { op: 'ready', id: 'one' }, { op: 'end', id: 'one' }, { op: 'get', id: 'one' },
 ])
 parity([
  { op: 'bind', input: input('one'), cleanup: { released: ['first'] } },
  { op: 'bind', input: input('two'), cleanup: { released: ['second'] } },
  { op: 'attach', input: input('user') }, { op: 'shutdown' },
 ])
})

test('concurrent/repeated end waits for one cleanup and returns isolated stable results', () => {
 const steps = [
  { op: 'bind', input: input('one'), cleanup: { delayMs: 50, released: ['child group'] } },
  { op: 'concurrent-end', id: 'one' },
 ]
 const result = query([...steps, { op: 'mutate-end', id: 'one' }, { op: 'end', id: 'one' }])
 const end = result.replies[1].value
 assert.equal(end.waited, true)
 assert.equal(end.pendingAfter, false)
 assert.deepEqual(end.first, end.second)
 assert.deepEqual(result.replies[2].value, end.first)
 assert.deepEqual(result.replies[3].value, end.first)
 assert.deepEqual(result.cleanupCalls, ['one'])
 const reference = query(steps, false).replies[1].value
 assert.equal(reference.waited, false, 'The stricter native guarantee intentionally waits for pending cleanup')
 assert.notDeepEqual(reference.first, reference.second)
})

test('retired/duplicate identities and shutdown cannot orphan or replace owned cleanups', () => {
 const result = query([
  { op: 'bind', input: input('one'), cleanup: { released: ['owned'] } },
  { op: 'attach', input: input('one') }, { op: 'bind', input: input('one') },
  { op: 'end', id: 'one' }, { op: 'bind', input: input('one') }, { op: 'shutdown' },
  { op: 'bind', input: input('new') }, { op: 'attach', input: input('new') },
 ])
 for (const index of [1, 2, 4]) {
  assert.equal(result.replies[index].ok, false)
  assert.match(result.replies[index].message, /already exists/)
 }
 for (const index of [6, 7]) {
  assert.equal(result.replies[index].ok, false)
  assert.match(result.replies[index].message, /shutting down/)
 }
 assert.deepEqual(result.cleanupCalls, ['one'])
})

test('attached end awaits its own observer cleanup once while preserving external ownership', () => {
 const result = query([
  { op: 'attach', input: input('external'), cleanup: { delayMs: 40, released: ['native observer'] } },
  { op: 'concurrent-end', id: 'external' }, { op: 'end', id: 'external' },
 ])
 const end = result.replies[1].value
 assert.equal(end.waited, true)
 assert.equal(end.pendingAfter, false)
 assert.deepEqual(end.first, end.second)
 assert.deepEqual(end.first, result.replies[2].value)
 assert.deepEqual(end.first.released, ['native observer'])
 assert.match(end.first.preserved[0], /user-owned/)
 assert.deepEqual(result.cleanupCalls, ['external'])
})

test('snapshot mutation, throwing observers and reentrant end cannot bypass cleanup', () => {
 const result = query([
  { op: 'attach', input: input('user', { buildIdentity: { label: 'actual' } }) },
  { op: 'mutate-snapshot', id: 'user' },
  { op: 'bind', input: input('one'), cleanup: { released: ['owned'] } },
  { op: 'ready', id: 'one' }, { op: 'end', id: 'one' },
 ], true, { observerThrows: true, endOnReady: true })
 assert.equal(result.replies[1].value.appId, '.')
 assert.equal(result.replies[1].value.buildIdentity.label, 'actual')
 assert.equal(result.observerFailures, result.events.length)
 assert.deepEqual(result.cleanupCalls, ['one'])
 assert.deepEqual(result.events.filter(row => row.sessionId === 'one').map(row => row.state), ['starting', 'ready', 'stopped'])
})

test('generated identities are distinct UUIDv4 and rejected inputs never create sessions', () => {
 const result = query([
  { op: 'bind', input: input(undefined) }, { op: 'attach', input: input(undefined) },
  { op: 'bind', input: input('') }, { op: 'bind', input: input('bad', { appId: '' }) }, { op: 'list' }, { op: 'shutdown' },
 ])
 const ids = result.replies.slice(0, 2).map(row => row.value.sessionId)
 for (const id of ids) {assert.match(id, /^sess_[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)}
 assert.notEqual(ids[0], ids[1])
 assert.equal(result.replies[2].ok, false)
 assert.equal(result.replies[3].ok, false)
 assert.equal(result.replies[4].value.length, 2)
})

test('owned session end reaps an armed process group while attached end preserves it', { skip: process.platform !== 'darwin' }, () => {
 const marker = join(scratch, 'owned-pids.json')
 const source = `const {spawn}=require('node:child_process'); const fs=require('node:fs');
const child=spawn(process.execPath,['-e','process.on("SIGTERM",()=>{});process.stdout.write("ready");setInterval(()=>{},1000)'],{stdio:['ignore','pipe','ignore']});
process.on('SIGTERM',()=>{});
child.stdout.once('data',()=>{fs.writeFileSync(${JSON.stringify(marker)},JSON.stringify([process.pid,child.pid]));process.stdout.write('armed');});
setInterval(()=>{},1000);`
 const value = query([], true, { operation: 'session-process', command: process.execPath, args: ['-e', source], marker })
 assert.equal(value.preservedBeforeRelease, true)
 assert.match(value.attached.preserved[0], /user-owned/)
 assert.equal(value.waitedForCleanup, true)
 assert.equal(value.cleanupCalls, 1)
 assert.deepEqual(value.first, value.second)
 assert.equal(value.exitFinishedBeforeManagerClose, true)
 assert.deepEqual(value.aliveBeforeManagerClose, [false, false])
 for (const pid of JSON.parse(readFileSync(marker))) {assert.throws(() => process.kill(pid, 0), { code: 'ESRCH' })}
})
