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
const scratch = scratchRun(root, 'jobs')
after(() => rmSync(scratch, { recursive: true, force: true }))
const input = (extra = {}) => ({ kind: 'build', sessionId: 'session-one', ...extra })
function normalize(value, ids = new Map()) {
 if (Array.isArray(value)) {return value.map(item => normalize(item, ids))}
 if (value && typeof value === 'object') {return Object.fromEntries(Object.entries(value).map(([key, item]) => {
  if (key === 'jobId') {
   assert.match(item, /^job_[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
   if (!ids.has(item)) {ids.set(item, `job-${ids.size + 1}`)}
   return [key, ids.get(item)]
  }
  if (key === 'createdAt' || key === 'finishedAt') {
   assert.match(item, /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/)
   assert.ok(Math.abs(Date.parse(item) - Date.now()) < 60000)
   return [key, '<current-utc>']
  }
  return [key, normalize(item, ids)]
 }))}
 return value
}
function query(steps, native = true, extra = {}) {
 const run = spawnSync(native ? binary : process.execPath, native ? [] : [join(import.meta.dirname, 'jobs-reference.mjs')],
  { input: JSON.stringify({ operation: 'jobs', dir: scratch, steps, ...extra }) + '\n', encoding: 'utf8', timeout: 15000 })
 assert.equal(run.status, 0, run.stderr)
 assert.equal(run.stderr, '')
 const value = JSON.parse(run.stdout)
 assert.equal(value.ok, true, value.message)
 return value.value
}
function parity(steps, extra = {}) {
 const actual = query(steps, true, extra), expected = query(steps, false, extra)
 assert.deepEqual(normalize(actual), normalize(expected))
 return actual
}

test('provider-driven jobs retain states, progress, results, errors and no-op terminal behavior', () => {
 parity([
  { op: 'status', alias: 'missing' }, { op: 'cancel', alias: 'missing' },
  { op: 'start', alias: 'one', input: input() },
  { op: 'progress', alias: 'one', progress: { phase: 'compile', count: 1 } },
  { op: 'progress', alias: 'one', progress: { phase: 'package' } },
  { op: 'succeed', alias: 'one', result: { artifact: 'app' } },
  { op: 'progress', alias: 'one', progress: { phase: 'ignored' } },
  { op: 'fail', alias: 'one', error: { code: 'execution_failure', message: 'ignored' } },
  { op: 'cancel', alias: 'one' },
  { op: 'start', alias: 'two', input: input({ sessionId: null }) },
  { op: 'fail', alias: 'two', error: { code: 'prerequisite_missing', message: 'Install tools', recovery: { action: 'Install' } } },
  { op: 'start', alias: 'three', input: { kind: 'build' } }, { op: 'cancel', alias: 'three' },
  { op: 'succeed', alias: 'three', result: false }, { op: 'list' },
 ])
})

test('deduplication scopes live request keys by kind and exact session identity', () => {
 const steps = [
  { op: 'start', alias: 'one', input: input({ requestKey: 'request' }), runner: { gate: true, progress: { phase: 'building' } } },
  { op: 'start', alias: 'duplicate', input: input({ requestKey: 'request' }), runner: { result: 'must not execute' } },
  ...[{ kind: 'launch' }, { sessionId: 'session-two' }, { sessionId: null }, { requestKey: '' }].map((extra, i) =>
   ({ op: 'start', alias: `other-${i}`, input: input({ requestKey: 'request', ...extra }) })),
  { op: 'complete', alias: 'one', result: { artifact: 'done' } }, { op: 'wait', alias: 'one' },
  { op: 'start', alias: 'retry', input: input({ requestKey: 'request' }) }, { op: 'list' },
 ]
 const result = parity(steps)
 assert.equal(result.replies[1].value.deduplicated, true)
 assert.deepEqual(result.runnerCalls, ['one'])
 const absence = parity([
  { op: 'start', alias: 'absent', input: { kind: 'build', requestKey: 'request' } },
  { op: 'start', alias: 'null', input: { kind: 'build', requestKey: 'request', sessionId: null } },
 ])
 assert.equal(absence.replies[1].value.deduplicated, false)
})

test('runner completion and generic/structured failures remain observable', () => {
 for (const failure of [undefined, { message: 'compiler failed' }, {
  code: 'disconnected_runtime', message: 'bridge gone', retryable: true,
  recovery: { action: 'Reconnect' }, context: { instance: 'fixture' },
 }]) {
  const result = parity([
   { op: 'start', alias: 'one', input: input(), runner: { gate: true, failure } },
   { op: 'complete', alias: 'one', result: { success: true } }, { op: 'wait', alias: 'one' }, { op: 'status', alias: 'one' },
  ])
  assert.equal(result.replies[2].value.state, failure ? 'failed' : 'succeeded')
 }
})

test('cancellation remains cooperative and retains a returned result after settling', () => {
 const result = parity([
  { op: 'start', alias: 'one', input: input({ requestKey: 'cancel' }), runner: { gate: true } },
  { op: 'cancel', alias: 'one' }, { op: 'status', alias: 'one' },
  { op: 'start', alias: 'duplicate', input: input({ requestKey: 'cancel' }) },
  { op: 'complete', alias: 'one', result: { partial: 'stopped' } }, { op: 'wait', alias: 'one' }, { op: 'cancel', alias: 'one' },
 ])
 assert.equal(result.replies[1].value.state, 'cancelling')
 assert.equal(result.replies[3].value.deduplicated, true)
 assert.equal(result.replies[5].value.state, 'cancelled')
 assert.deepEqual(result.replies[5].value.result, { partial: 'stopped' })
 parity([
  { op: 'start', alias: 'one', input: input(), runner: { gate: true, failure: { message: 'cancel unwind' } } },
  { op: 'cancel', alias: 'one' }, { op: 'complete', alias: 'one' }, { op: 'wait', alias: 'one' },
 ])
})

test('history trims terminal jobs by finish time while retaining live work', () => {
 for (const historyLimit of [0, 1, 2]) {
  parity([
   { op: 'start', alias: 'one', input: input() }, { op: 'start', alias: 'two', input: input() },
   { op: 'start', alias: 'live', input: input() },
   { op: 'succeed', alias: 'two', result: 'second created, first finished' }, { op: 'pause', ms: 5 },
   { op: 'succeed', alias: 'one', result: 'first created, last finished' }, { op: 'list' },
  ], { historyLimit })
 }
 const cancelled = query([
  { op: 'start', alias: 'one', input: input() }, { op: 'cancel', alias: 'one' },
  { op: 'start', alias: 'two', input: input() }, { op: 'cancel', alias: 'two' }, { op: 'list' },
 ], true, { historyLimit: 1 })
 assert.equal(cancelled.replies[4].value.length, 1, 'Cancelled provider jobs also obey the native history bound')
})

test('immediate runners report actual completion without depending on JS microtask timing', () => {
 const result = query([
  { op: 'start', alias: 'one', input: input(), runner: { result: { answer: 42 } } },
  { op: 'wait', alias: 'one' }, { op: 'mutate-snapshot', alias: 'one' },
 ])
 assert.equal(result.replies[0].value.job.state, 'succeeded')
 assert.equal(result.replies[1].value.state, 'succeeded')
 assert.deepEqual(result.replies[2].value.result, { answer: 42 })
 const reference = query([
  { op: 'start', alias: 'one', input: input(), runner: { result: { answer: 42 } } }, { op: 'wait', alias: 'one' },
 ], false)
 assert.equal(reference.replies[0].value.job.state, 'running')
 assert.deepEqual(normalize(result.replies[1].value), normalize(reference.replies[1].value))
})

test('owned runners cannot be manually finalized and shutdown cancels/drains before rejecting new work', () => {
 const result = query([
  { op: 'start', alias: 'one', input: input(), runner: { gate: true } },
  { op: 'succeed', alias: 'one', result: 'premature' },
  { op: 'fail', alias: 'one', error: { code: 'execution_failure', message: 'premature' } },
  { op: 'status', alias: 'one' }, { op: 'complete', alias: 'one', result: 'actual' }, { op: 'wait', alias: 'one' },
  { op: 'start', alias: 'two', input: input(), runner: { untilCancelled: true, cleanupDelayMs: 20, result: 'cleanup complete' } },
  { op: 'close' }, { op: 'status', alias: 'two' }, { op: 'start', alias: 'new', input: input() },
 ])
 for (const index of [1, 2]) { assert.equal(result.replies[index].ok, false); assert.match(result.replies[index].message, /runner must settle/) }
 assert.equal(result.replies[3].value.state, 'running')
 assert.equal(result.replies[5].value.result, 'actual')
 assert.equal(result.replies[8].value.state, 'cancelled')
 assert.equal(result.replies[8].value.result, 'cleanup complete')
 assert.equal(result.replies[9].ok, false)
 assert.match(result.replies[9].message, /shutting down/)
})

test('job cancellation drains an armed child and descendant before close returns', { skip: process.platform !== 'darwin' }, () => {
 const marker = join(scratch, 'job-pids.json')
 const source = `const {spawn}=require('node:child_process');const fs=require('node:fs');
const child=spawn(process.execPath,['-e','process.on("SIGTERM",()=>{});process.stdout.write("ready");setInterval(()=>{},1000)'],{stdio:['ignore','pipe','ignore']});
process.on('SIGTERM',()=>{});child.stdout.once('data',()=>{fs.writeFileSync(${JSON.stringify(marker)},JSON.stringify([process.pid,child.pid]));process.stdout.write('armed')});setInterval(()=>{},1000);`
 // Exercise exit/reaping interleavings without sleeping after cleanup returns.
 for (let attempt=0;attempt<8;attempt++) {
  const value = query([], true, { operation: 'job-process', command: process.execPath, args: ['-e', source], marker })
  assert.equal(value.cancelling.state, 'cancelling')
  assert.equal(value.prematureRejected, true)
  assert.equal(value.closeWaited, true)
  assert.equal(value.job.state, 'cancelled')
  assert.deepEqual(value.job.result, { stopped: true })
  assert.equal(value.exitFinishedBeforeManagerClose, true)
  assert.deepEqual(value.aliveBeforeManagerClose, [false, false])
  for (const pid of JSON.parse(readFileSync(marker))) {assert.throws(() => process.kill(pid, 0), { code: 'ESRCH' })}
 }
})

test('invalid runner futures and uninitialized structured exceptions become explicit failures', () => {
 for (const runner of [{ nilFuture: true }, { bareContract: true }]) {
  const result = query([{ op: 'start', alias: 'one', input: input(), runner }, { op: 'wait', alias: 'one' }])
  const job = result.replies[1].value
  assert.equal(job.state, 'failed')
  assert.equal(job.error.code, 'execution_failure')
  assert.match(job.error.message, runner.nilFuture ? /did not return a future/ : /Bare fixture failure/)
 }
})
