import { test, after } from 'node:test'
import assert from 'node:assert/strict'
import { spawn, spawnSync } from 'node:child_process'
import { once } from 'node:events'
import { mkdtempSync, mkdirSync, writeFileSync, chmodSync, rmSync, readFileSync, existsSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { assertCurrentNativeBuild, processProbeInputs } from './native-inputs.mjs'
import { assertPortabilityArtifact } from './portability-proof.mjs'

const root = resolve(import.meta.dirname, '../..')
const portable = existsSync(join(root, 'portability-source.json'))
const work = portable ? resolve(process.env.XPLAT_NIM_PORTABILITY_CACHE ?? join(root, 'research/nim-portability')) : join(root, 'research/nim-cli')
const binary = join(work, `${portable ? 'bin' : 'native'}/process-probe${process.platform === 'win32' ? '.exe' : ''}`)
const reference = join(import.meta.dirname, 'process-reference.mjs')
const supported = ['darwin', 'linux'].includes(process.platform)
const posixHost = { skip: !supported }
mkdirSync(join(work, 'process-fixtures'), { recursive: true })
const base = mkdtempSync(join(work, 'process-fixtures/run-'))
const evidence = []
after(() => {
 writeFileSync(join(work, 'process-differential.json'), JSON.stringify(evidence))
 rmSync(base, { recursive: true, force: true })
})
if (supported) {
 if (portable) {assertPortabilityArtifact(root, JSON.parse(readFileSync(join(work, 'process-build-result.json'))), readFileSync(binary), 'tools/cli-nim/process_probe.nim')}
 else {assertCurrentNativeBuild(root, JSON.parse(readFileSync(join(work, 'native/process-build.json'))), readFileSync(binary), processProbeInputs)}
}
function file(name, text, executable = false) {
 const path = join(base, name)
 mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, text)
 if (executable) {chmodSync(path, 0o755)}
 return path
}
async function run(requests, node = false) {
 const child = spawn(node ? process.execPath : binary, node ? [reference] : [],
  { cwd: root, env: { ...process.env, PATH: '' }, stdio: ['pipe', 'pipe', 'pipe'] })
 let output = '', error = ''
 child.stdout.setEncoding('utf8'); child.stderr.setEncoding('utf8')
 child.stdout.on('data', chunk => { output += chunk })
 child.stderr.on('data', chunk => { error += chunk })
 const timer = setTimeout(() => child.kill('SIGKILL'), 12000)
 const closed = once(child, 'close')
 child.stdin.end(requests.map(request => JSON.stringify(request)).join('\n') + '\n')
 try {
  const [code, signal] = await closed
  assert.equal(code, 0, `probe ${node ? 'Node' : 'Nim'} failed: ${signal ?? code}: ${error}`)
  assert.equal(error, '')
  const values = output.trim().split('\n').map(line => JSON.parse(line))
  assert.equal(values.length, requests.length)
  return values
 } finally { clearTimeout(timer) }
}
function comparable(value) {
 const { exit, records } = value
 return { exit: { code: exit.code, signal: exit.signal, ...(exit.errorCode ? { errorCode: exit.errorCode } : {}) },
  stdout: records.filter(record => record.stream === 'stdout'), stderr: records.filter(record => record.stream === 'stderr'),
  ...(Object.hasOwn(value,'stdoutBase64') ? { stdoutBase64: value.stdoutBase64, stderrBase64: value.stderrBase64 } : {}),
  cwdUnchanged: value.cwdUnchanged }
}
async function compare(request) {
 const [expected] = await run([request], true)
 const [actual] = await run([request])
 evidence.push({ request, expected, actual })
 if (Object.hasOwn(expected,'invalid')) { assert.deepEqual(actual, expected); return actual }
 assert.ok(actual.exit, JSON.stringify(actual))
 assert.deepEqual(comparable(actual), comparable(expected))
 assert.equal(actual.cwdUnchanged, true)
 return actual
}
const nodeRequest = source => ({ cmd: process.execPath, args: ['-e', source] })
const pause = ms => new Promise(resolve => setTimeout(resolve, ms))
function active(pid) {
 const result = spawnSync('/bin/ps', ['-o', 'stat=', '-p', String(pid)], { encoding: 'utf8' })
 return result.status === 0 && result.stdout.trim() && !result.stdout.trim().startsWith('Z')
}
async function assertGone(pid) {
 for (let attempt = 0; attempt < 100 && active(pid); attempt++) {await pause(10)}
 assert.equal(Boolean(active(pid)), false, `owned process ${pid} is still running`)
}
function assertReaped(pid) {
 let error
 try {process.kill(pid, 0)} catch (failure) {error = failure}
 assert.equal(error?.code, 'ESRCH', `owned process ${pid} still has a kernel identity`)
}

test('incremental UTF-8 and bounded UTF-16 line framing match actual TypeScript pipeLines', posixHost, async () => {
 const cases = []
 const add = chunks => cases.push({ operation: 'lines', chunks: chunks.map(chunk => Buffer.from(chunk).toString('base64')) })
 for (let byte = 0; byte < 256; byte++) {add([[byte]])}
 const buffers = [Buffer.from('😀α\r\n\npartial\r'), Buffer.from([0xf0,0x9f,0x98]),
  Buffer.from([0xe0,0x80,0x80,0x0a]), Buffer.from([0xed,0xa0,0x80,0xf4,0x90,0x80,0x80]),
  Buffer.from([0x61,0xe2,0x82,0x0a,0xef,0xbb,0xbf,0x62]),
  ...[8190,8191,8192,8193,30000].map(length => Buffer.from('x'.repeat(length)+'\r\nnext\npartial')),
  Buffer.from('x'.repeat(8191)+'😀'+'\nnext\n')]
 for (const bytes of buffers) {
  add([bytes])
  for (const size of [1,2,3,7,8192]) {
   const chunks = []
   for (let at = 0; at < bytes.length; at += size) {chunks.push(bytes.subarray(at,at+size))}
   add(chunks)
  }
 }
 let seed = 7311
 for (let sample = 0; sample < 300; sample++) {
  const chunks = []
  for (let part = 0; part < 6; part++) {
   const bytes = Buffer.alloc(1 + (sample+part)%9)
   for (let at = 0; at < bytes.length; at++) { seed = (1664525 * seed + 1013904223) >>> 0; bytes[at] = seed >>> 24 }
   chunks.push(bytes)
  }
  add(chunks)
 }
 const expected = await run(cases, true), actual = await run(cases)
 for (const [at, request] of cases.entries()) {assert.deepEqual(actual[at], expected[at], JSON.stringify(request))}
 evidence.push({ operation: 'lines', cases: cases.length, passed: true })
})

test('argv is literal, cwd and merged environment reach the child without changing owner cwd', posixHost, async () => {
 const cwd = join(base, 'work space'); mkdirSync(cwd)
 const request = { cmd: process.execPath, cwd, env: { NIM_PROCESS_FIXTURE: 'present', PATH: '' },
  args: ['-e', 'console.log(JSON.stringify({args:process.argv.slice(1),cwd:process.cwd(),env:process.env.NIM_PROCESS_FIXTURE,path:process.env.PATH,home:!!process.env.HOME,stdin:require("node:fs").readFileSync(0).length}))', '--',
   'space arg', 'a"b', '$(echo must-stay-literal)', '*', '', 'é😀'] }
 const result = await compare(request)
 assert.equal(result.exit.code, 0)
 assert.deepEqual(JSON.parse(result.records[0].line).args, request.args.slice(3))
 assert.equal(JSON.parse(result.records[0].line).stdin, 0)
})

test('unrelated inheritable descriptors stay in the owner rather than leaking to the child', posixHost, async () => {
 const path = file('descriptor-sentinel', 'task-local non-secret sentinel')
 const request = { cmd: process.execPath, args: ['-e',
  "const fs=require('node:fs');let leaked=false;try{const child=fs.fstatSync(Number(process.env.NIM_PROCESS_LEAK_FD));const parent=fs.statSync(process.argv[1]);leaked=child.ino===parent.ino&&child.dev===parent.dev}catch{}console.log(JSON.stringify({leaked}))", path], leakFile: path }
 const [result] = await run([request])
 assert.equal(result.exit.code, 0)
 assert.deepEqual(JSON.parse(result.records[0].line), { leaked: false })
})

test('PATH resolution uses the child override and child-relative directories', posixHost, async () => {
 const exe = file('path-work/child-bin/unique-nim-fixture', '#!/bin/sh\nprintf "override:%s\\n" "$NIM_PROCESS_FIXTURE"\n', true)
 await compare({ cmd: 'unique-nim-fixture', cwd: dirname(dirname(exe)), env: { PATH: 'child-bin', NIM_PROCESS_FIXTURE: 'yes' } })
 await compare({ cmd: './child-bin/unique-nim-fixture', cwd: dirname(dirname(exe)), env: { PATH: '' } })
 const missing = await compare({ cmd: 'definitely-absent-xplat-executable', env: { PATH: '' } })
 assert.equal(missing.exit.errorCode, 'ENOENT')
 const denied = file('not-executable', 'not executable')
 assert.equal((await compare({ cmd: denied })).exit.errorCode, 'EACCES')
 const textExecutable = file('text-executable', 'printf "%s\\n" "$1"\n', true)
 const noInterpreter = { cmd: textExecutable, args: ['literal $(echo nope) *'] }
 const [reference] = await run([noInterpreter], true), [native] = await run([noInterpreter])
 assert.deepEqual(native, { invalid: 'spawn ENOEXEC' })
 if (process.platform === 'linux') {
  assert.equal(reference.exit.code, 0)
  assert.equal(reference.records[0].line, noInterpreter.args[0])
 } else {assert.deepEqual(reference, native)}
 evidence.push({ request: noInterpreter, reference, native,
  deliberateDifference: 'Native launches require a valid executable or explicit shebang; no implicit shell fallback.' })
 await compare({ cmd: '/usr/bin/printf', cwd: denied })
 assert.equal((await compare({ cmd: '/usr/bin/printf', cwd: join(base, 'absent-cwd') })).exit.errorCode, 'ENOENT')
})

test('simultaneous large stdout/stderr, split UTF-8 and partial lines drain without deadlock', posixHost, async () => {
 const result = await compare(nodeRequest("process.stdout.write(Buffer.from([0xf0,0x9f]));setTimeout(()=>{process.stdout.write(Buffer.from([0x98,0x80,10]));for(let i=0;i<96;i++){process.stdout.write('o'.repeat(8000)+'\\n');process.stderr.write('e'.repeat(8000)+'\\n')}process.stdout.write('partial');process.stderr.write(Buffer.from([0xe2,0x82]))},10)"))
 assert.ok(result.records.some(record => record.line === '😀'))
 assert.ok(result.records.some(record => record.line === 'partial'))
 assert.ok(result.records.some(record => record.stream === 'stderr' && record.line === '�'))
})

test('raw wait status distinguishes an exit code of 143 from SIGTERM', posixHost, async () => {
 assert.equal((await compare(nodeRequest('process.exit(143)'))).exit.code, 143)
 const signaled = await compare(nodeRequest("process.kill(process.pid,'SIGTERM')"))
 assert.equal(signaled.exit.code, null); assert.equal(signaled.exit.signal, 'SIGTERM')
})

test('raw passthrough retains every byte separately from decoded log lines', posixHost, async () => {
 const result = await compare({ ...nodeRequest("const bytes=Buffer.from(Array.from({length:256},(_,i)=>i));process.stdout.write(bytes);process.stderr.write(Buffer.from(bytes).reverse())"), raw: true })
 assert.deepEqual(Buffer.from(result.stdoutBase64,'base64'), Buffer.from(Array.from({ length: 256 }, (_, i) => i)))
 assert.deepEqual(Buffer.from(result.stderrBase64,'base64'), Buffer.from(Array.from({ length: 256 }, (_, i) => 255-i)))
})

test('native owner exit preserves status bytes above 127', posixHost, () => {
 for (const status of [0,7,127,128,130,143,200,255]) {
  const result = spawnSync(binary, [], { input: JSON.stringify({ operation: 'exit', status })+'\n', encoding: 'utf8', env: { ...process.env, PATH: '' } })
  assert.equal(result.status, status, result.stderr)
 }
})

test('one manager drains independent children while a slow child is cancelled', posixHost, async () => {
 const request = { operation: 'parallel', requests: [
  { ...nodeRequest("console.log('slow');setInterval(()=>{},1000)"), abortMs: 350 }, nodeRequest("console.log('fast')")
 ] }
 const [expected] = await run([request], true), [actual] = await run([request])
 for (let at = 0; at < actual.length; at++) {assert.deepEqual(comparable(actual[at]), comparable(expected[at]))}
 assert.ok(actual[1].elapsedMs < actual[0].elapsedMs-100, JSON.stringify(actual))
 evidence.push({ request, expected, actual })
})

test('stop, repeated stop and cancellation preserve cooperative exit and forced escalation', posixHost, async () => {
 const cooperative = await compare({ ...nodeRequest("process.on('SIGTERM',()=>{console.log('term');process.exit(7)});console.log('ready');setInterval(()=>{},1000)"),
  stopOnLine: 'ready', repeatStop: true, graceMs: 100 })
 assert.equal(cooperative.exit.code, 7)
 assert.ok(cooperative.records.some(record => record.line === 'term'))
 const forced = await compare({ ...nodeRequest("process.on('SIGTERM',()=>{});console.log('ready');setInterval(()=>{},1000)"), stopOnLine: 'ready', graceMs: 40 })
 assert.equal(forced.exit.signal, 'SIGKILL')
 const preabort = await compare({ ...nodeRequest('setInterval(()=>{},1000)'), preabort: true })
 assert.equal(preabort.exit.signal, 'SIGTERM')
 const repeated = await compare({ ...nodeRequest('setInterval(()=>{},1000)'), doubleStop: true, repeatStop: true })
 assert.equal(repeated.exit.signal, 'SIGTERM')
})

test('manager close and output callback failure kill and reap their owned child', posixHost, async () => {
 for (const extra of [{ closeOnLine: 'ready' }, { sinkError: true }]) {
  // The failure path sends TERM before immediate KILL. Install resistance
  // before readiness so the forced-exit assertion is independent of scheduling.
  const resist = extra.sinkError ? "process.on('SIGTERM',()=>{});" : ''
  const [result] = await run([{ ...nodeRequest(resist+"console.log('ready');setInterval(()=>{},1000)"), ...extra }])
  assert.equal(result.exit.signal, extra.sinkError ? 'SIGKILL' : 'SIGTERM')
  if (extra.sinkError) {assert.equal(result.exit.error, 'fixture sink failure')}
  await assertGone(result.pid)
 }
})

test('group cancellation releases a descendant even after the leader exits first', posixHost, async () => {
 const marker = join(base, 'group-marker.json')
 const source = `const {spawn}=require('node:child_process');const child=spawn(process.execPath,['-e',"process.on('SIGTERM',()=>{});console.log('descendant:'+process.pid);setInterval(()=>{},1000);setTimeout(()=>process.exit(9),5000)"],{stdio:['ignore','pipe','inherit']});child.stdout.on('data',b=>{require('node:fs').writeFileSync(${JSON.stringify(marker)},JSON.stringify({leader:process.pid,descendant:child.pid}));process.stdout.write(b);console.log('ready')});process.on('SIGTERM',()=>process.exit(0));setInterval(()=>{},1000);setTimeout(()=>process.exit(9),5000)`
 const request = { ...nodeRequest(source), stopOnLine: 'ready', graceMs: 40 }
 const [result] = await run([request])
 const descendant = result.records.find(record => record.line.startsWith('descendant:'))
 assert.ok(descendant, JSON.stringify(result))
 assert.equal(result.exit.code, 0)
 assertReaped(Number(descendant.line.slice('descendant:'.length)))
 assertReaped(result.pid)
 await assertGone(Number(descendant.line.slice('descendant:'.length)))
 await assertGone(result.pid)
 evidence.push({ operation: 'leader-first-group-stop', result })
 // Bound the independent oracle's ownership gap and clean only this fixture's
 // known group. A repaired reference may finish normally; no assertion depends
 // on retaining that bug. The native positive gate above always has to pass.
 rmSync(marker)
 const oracle = spawn(process.execPath, [reference], { env: { ...process.env, PATH: '' }, stdio: ['pipe','pipe','pipe'] })
 oracle.stdout.resume(); oracle.stderr.resume()
 const closed = once(oracle, 'close')
 oracle.stdin.end(JSON.stringify(request)+'\n')
 let referenceFinished = false
 const watchdog = pause(1000).then(() => false)
 try {
  referenceFinished = await Promise.race([closed.then(() => true),watchdog])
 } finally {
  const owned = JSON.parse(readFileSync(marker,'utf8'))
  if (!referenceFinished) { try { process.kill(-owned.leader,'SIGKILL') } catch {} }
  const timer = setTimeout(() => oracle.kill('SIGKILL'),2000)
  await closed.finally(() => clearTimeout(timer))
  await assertGone(owned.descendant)
  await assertGone(owned.leader)
 }
 evidence.push({ operation: 'leader-first-reference', finishedBeforeCleanup: referenceFinished, waitBudgetMs: 1000 })
})

test('Linux process names with parentheses and newlines do not hide owned descendants', { skip: process.platform !== 'linux' }, async () => {
 const descendant = "process.title='xplat) (\\n';process.on('SIGTERM',()=>{});console.log(JSON.stringify({pid:process.pid,stat:require('node:fs').readFileSync('/proc/self/stat','utf8')}));setInterval(()=>{},1000)"
 const source = `const {spawn}=require('node:child_process');const child=spawn(process.execPath,['-e',${JSON.stringify(descendant)}],{stdio:['ignore','pipe','inherit']});process.on('SIGTERM',()=>process.exit(7));child.stdout.once('data',bytes=>{process.stdout.write(bytes);console.log('ready')});setInterval(()=>{},1000)`
 const [result] = await run([{ ...nodeRequest(source), stopOnLine: 'ready', graceMs: 40 }])
 const observed = JSON.parse(result.records.find(record => record.line.startsWith('{')).line)
 assert.match(observed.stat, /\(xplat\) \(\n\)/)
 assert.equal(result.exit.code, 7)
 assertReaped(observed.pid)
 assertReaped(result.pid)
 evidence.push({ operation: 'linux-process-name', result, observed })
})

test('normal owner exit and handled SIGINT/SIGTERM clean their isolated groups', posixHost, async () => {
 for (const signal of [null, 'SIGINT', 'SIGTERM']) {
  const child = spawn(binary, [], { env: { ...process.env, PATH: '' }, stdio: ['pipe','pipe','pipe'] })
  let output = '', error = ''
  child.stdout.setEncoding('utf8'); child.stderr.setEncoding('utf8')
  child.stderr.on('data', chunk => { error += chunk })
  const closed = once(child, 'close')
  const ready = new Promise(resolve => child.stdout.on('data', chunk => {
   output += chunk
   if (output.includes('\n')) {resolve(JSON.parse(output.slice(0, output.indexOf('\n'))))}
  }))
  const timer = setTimeout(() => child.kill('SIGKILL'), 5000)
  child.stdin.end(JSON.stringify({ ...nodeRequest("console.log('ready');setInterval(()=>{},1000)"), ownerReady: true,
   quitOwner: !signal, signals: !!signal })+'\n')
  let owned
  try {
   owned = await Promise.race([ready,closed.then(() => { throw Error('Owner exited before readiness: '+error) })])
   if (signal) {child.kill(signal)}
   const [code] = await closed
   assert.equal(error, '')
   assert.equal(code, signal === 'SIGINT' ? 130 : signal === 'SIGTERM' ? 143 : 0)
   await assertGone(owned.pid)
  } finally {
   clearTimeout(timer)
   if (owned && active(owned.pid)) { try { process.kill(-owned.pid, 'SIGKILL') } catch {} }
   if (child.exitCode === null && child.signalCode === null) {child.kill('SIGKILL')}
  }
 }
})
