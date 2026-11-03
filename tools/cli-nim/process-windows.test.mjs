// Actual Windows SDK jobs, pipes and child lifecycle. No POSIX emulation.
import { test, after } from 'node:test'
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync, existsSync, rmSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { assertCurrentNativeBuild, processProbeInputs } from './native-inputs.mjs'
import { assertPortabilityArtifact } from './portability-proof.mjs'

const root = resolve(import.meta.dirname, '../..')
const windows = process.platform === 'win32'
const host = { skip: !windows }
const portable = existsSync(join(root, 'portability-source.json'))
const work = portable ? resolve(process.env.XPLAT_NIM_PORTABILITY_CACHE ?? join(root, 'research/nim-portability')) : join(root, 'research/nim-cli')
const binary = join(work, portable ? 'bin/process-probe.exe' : 'native/process-probe.exe')
const evidence = []
let scratch
if (windows) {
 mkdirSync(join(work, 'process-fixtures'), { recursive: true })
 scratch = mkdtempSync(join(work, 'process-fixtures/windows-'))
 const bytes = readFileSync(binary)
 if (portable) {assertPortabilityArtifact(root, JSON.parse(readFileSync(join(work, 'process-build-result.json'))), bytes, 'tools/cli-nim/process_probe.nim')}
 else {assertCurrentNativeBuild(root, JSON.parse(readFileSync(join(work, 'native/process-build.json'))), bytes, processProbeInputs)}
}
after(() => {
 if (windows) {
  writeFileSync(join(work, 'process-windows-differential.json'), JSON.stringify(evidence, null, 2)+'\n')
  rmSync(scratch, { recursive: true, force: true })
 }
})
async function run(request, reference = false) {
 const child = spawn(reference ? process.execPath : binary,
  reference ? [join(import.meta.dirname, 'process-reference.mjs')] : [],
  { cwd: root, env: { ...process.env, PATH: '', NODE_PATH: '', NODE_OPTIONS: '' }, stdio: ['pipe','pipe','pipe'] })
 let output = '', errors = ''
 child.stdout.setEncoding('utf8'); child.stderr.setEncoding('utf8')
 child.stdout.on('data', value => {output += value}); child.stderr.on('data', value => {errors += value})
 const closed = once(child, 'close')
 const timer = setTimeout(() => child.kill('SIGKILL'), 12000)
 child.stdin.end(JSON.stringify(request)+'\n')
 try {
  const [code, signal] = await closed
  assert.equal(code, 0, `Probe failed: ${signal ?? code}: ${errors}`)
  assert.equal(errors, '')
  const value = JSON.parse(output.trim())
  for (const result of Array.isArray(value) ? value : [value]) {
   assert.ok(result.exit, JSON.stringify(result))
   assert.equal(result.cwdUnchanged, true)
  }
  return value
 } finally {clearTimeout(timer)}
}
function comparable(value) {
 return { exit: { code: value.exit.code, signal: value.exit.signal, ...(value.exit.errorCode ? { errorCode: value.exit.errorCode } : {}) },
  stdout: value.records.filter(line => line.stream === 'stdout'), stderr: value.records.filter(line => line.stream === 'stderr'),
  ...(Object.hasOwn(value, 'stdoutBase64') ? { stdoutBase64: value.stdoutBase64, stderrBase64: value.stderrBase64 } : {}) }
}
async function compare(request) {
 const expected = await run(request, true), actual = await run(request)
 assert.deepEqual(comparable(actual), comparable(expected))
 evidence.push({ request, expected, actual })
 return actual
}
function alive(pid) {
 try {process.kill(pid, 0); return true} catch (error) {if (error.code === 'ESRCH') {return false}; throw error}
}
async function gone(pid) {
 for (let attempt = 0; attempt < 200 && alive(pid); attempt++) {await delay(10)}
 assert.equal(alive(pid), false, `Owned Windows process ${pid} survived completion`)
}
const node = source => ({ cmd: process.execPath, args: ['-e', source] })
function tree(leaderExits = false, inheritedPipes = false) {
 return `const { spawn } = require('node:child_process');
const child = spawn(process.execPath, ['-e', 'process.on("SIGTERM",()=>{}); process.send("armed"); setTimeout(()=>{},30000)'],
 { stdio: ['ignore', ${inheritedPipes ? '"inherit"' : '"ignore"'}, ${inheritedPipes ? '"inherit"' : '"ignore"'}, 'ipc'], detached: true });
child.once('message', () => { console.log(JSON.stringify({pid:process.pid,child:child.pid})); console.log('armed'); ${leaderExits ? 'process.exit(23)' : 'setTimeout(()=>{},30000)'} });`
}

test('Windows literal argv, Unicode, explicit cwd, merged environment and NUL stdin match Node', host, async () => {
 const cwd = join(scratch, 'project space π'); mkdirSync(cwd)
 const args = ['space arg', 'a"b', '$(echo literal)', '*', '', 'é😀', 'C:\\trailing space\\', '\\"quoted\\\\', 'line\nbreak']
 const request = { cmd: process.execPath, cwd, env: { NIM_PROCESS_FIXTURE: 'present π😀', PATH: '' },
  args: ['-e', 'console.log(JSON.stringify({args:process.argv.slice(1),cwd:process.cwd(),value:process.env.NIM_PROCESS_FIXTURE,path:process.env.PATH,stdin:require("node:fs").readFileSync(0).length}))', '--', ...args] }
 const result = await compare(request)
 const value = JSON.parse(result.records[0].line)
 assert.deepEqual(value.args, args); assert.equal(value.cwd, cwd); assert.equal(value.stdin, 0)
})
test('Windows command lookup uses the child PATH with an empty owner PATH', host, async () => {
 const result = await compare({ ...node('console.log("selected-node")'), cmd: 'node', env: { PATH: dirname(process.execPath) } })
 assert.equal(result.exit.code, 0)
 const missing = await compare({ cmd: 'xplat-no-such-command', env: { PATH: '' } })
 assert.equal(missing.exit.errorCode, 'ENOENT')
})
test('Windows raw bytes, independent pipe drainage and ordinary exit codes match Node', host, async () => {
 const result = await compare({ ...node('const bytes=Buffer.from(Array.from({length:256},(_,i)=>i)); for(let i=0;i<512;i++){require("node:fs").writeSync(1,bytes);require("node:fs").writeSync(2,bytes)} process.exit(173)'), raw: true })
 assert.equal(result.exit.code, 173)
 assert.equal(Buffer.from(result.stdoutBase64, 'base64').length, 131072)
})
test('Windows refuses implicit batch-file execution and preserves the requested script', host, async () => {
 for (const extension of ['cmd', 'CMD', 'bat']) {
  const script = join(scratch, `must-not-execute.${extension}`), marker = join(scratch, 'batch-ran')
  writeFileSync(script, `@echo unsafe>"${marker}"\r\n`)
  for (const suffix of ['', '.', ' ']) {
   const result = await run({ cmd: script+suffix })
   assert.ok((suffix ? ['ENOEXEC','ENOENT'] : ['ENOEXEC']).includes(result.exit.errorCode), JSON.stringify(result))
   assert.equal(existsSync(marker), false)
   evidence.push({ operation: 'reject-batch-without-interpreter', suffix, result })
  }
 }
})
test('Windows manager drains independent children while one is cancelled', host, async () => {
 const result = await run({ operation: 'parallel', requests: [
  { ...node('console.log("armed"); setTimeout(()=>{},30000)'), stopOnLine: 'armed' },
  node('console.log("independent-fast-child")'),
 ] })
 assert.equal(result[0].exit.signal, 'SIGTERM'); assert.equal(result[1].exit.code, 0)
 assert.ok(result[1].records.some(line => line.line === 'independent-fast-child'))
 for (const value of result) {await gone(value.pid)}
 evidence.push({ operation: 'concurrent-manager', result })
})
test('Windows native owner preserves ordinary status bytes above 127', host, async () => {
 for (const expected of [0, 127, 128, 173, 255]) {
  const child = spawn(binary, [], { env: { ...process.env, PATH: '' }, stdio: ['pipe','ignore','pipe'] })
  const closed = once(child, 'close')
  const timer = setTimeout(() => child.kill('SIGKILL'), 5000)
  child.stdin.end(JSON.stringify({ operation: 'exit', status: expected })+'\n')
  try {
   const [status, signal] = await closed
   assert.equal(status, expected); assert.equal(signal, null)
  } finally {clearTimeout(timer)}
 }
 evidence.push({ operation: 'owner-status-bytes', passed: true })
})
test('Windows cancellation releases the job, descendant and shared repeated stop', host, async () => {
 const result = await run({ ...node(tree()), stopOnLine: 'armed', repeatStop: true, graceMs: 100 })
 const ids = JSON.parse(result.records[0].line)
 assert.equal(result.exit.signal, 'SIGTERM'); assert.ok(result.elapsedMs < 6000)
 await gone(ids.pid); await gone(ids.child)
 evidence.push({ operation: 'cancel-job', result, descendantsGone: true })
 const stopped = await run({ ...node('setTimeout(()=>{},30000)'), doubleStop: true })
 assert.equal(stopped.exit.signal, 'SIGTERM')
})
test('Windows completion releases silent and pipe-inheriting descendants after leader exit', host, async () => {
 for (const inheritedPipes of [false, true]) {
  const result = await run(node(tree(true, inheritedPipes)))
  const ids = JSON.parse(result.records[0].line)
  assert.equal(result.exit.code, 23); assert.ok(result.elapsedMs < 6000)
  await gone(ids.pid); await gone(ids.child)
  evidence.push({ operation: 'leader-exit', inheritedPipes, result, descendantsGone: true })
 }
})
test('Windows capture failure releases the owned job', host, async () => {
 const result = await run({ ...node(tree()), sinkError: true })
 const ids = JSON.parse(result.records[0].line)
 assert.equal(result.exit.errorCode, 'capture')
 await gone(ids.pid); await gone(ids.child)
 evidence.push({ operation: 'capture-failure', result, descendantsGone: true })
})
test('Windows supervisor death closes the private job while an unrelated process survives', host, async () => {
 const control = spawn(process.execPath, ['-e', 'console.log("control"); setTimeout(()=>{},30000)'], { stdio: ['ignore','pipe','ignore'] })
 const controlClosed = once(control, 'close')
 const owner = spawn(binary, [], { env: { ...process.env, PATH: '' }, stdio: ['pipe','pipe','pipe'] })
 const ownerClosed = once(owner, 'close')
 const timer = setTimeout(() => owner.kill('SIGKILL'), 12000)
 try {
  await once(control.stdout, 'data')
  let output = ''
  owner.stdout.setEncoding('utf8')
  const ready = new Promise(resolve => owner.stdout.on('data', value => {output += value; if (output.includes('\n')) {resolve(JSON.parse(output.split('\n')[0]))}}))
  owner.stdin.end(JSON.stringify({ ...node(tree()), ownerReady: true })+'\n')
  const marker = await Promise.race([ready, ownerClosed.then(() => assert.fail('Owner exited before readiness'))])
  const ids = JSON.parse(marker.ready[0].line)
  assert.equal(marker.pid, ids.pid)
  owner.kill('SIGKILL'); await ownerClosed
  await gone(ids.pid); await gone(ids.child)
  assert.equal(alive(control.pid), true)
  evidence.push({ operation: 'owner-death', descendantsGone: true, unrelatedPreserved: true })
 } finally {
  clearTimeout(timer)
  if (owner.exitCode === null && owner.signalCode === null) {owner.kill('SIGKILL'); await ownerClosed}
  if (control.exitCode === null && control.signalCode === null) {control.kill('SIGKILL')}
  await controlClosed
 }
})
