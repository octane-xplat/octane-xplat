import { test, after } from 'node:test'
import assert from 'node:assert/strict'
import { spawn, execFile } from 'node:child_process'
import { createServer, connect } from 'node:net'
import { readFileSync, writeFileSync, unlinkSync, rmSync, existsSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { promisify } from 'node:util'
import { randomUUID } from 'node:crypto'
import { setTimeout as delay } from 'node:timers/promises'
import { scratchRun } from './scratch.mjs'
import { assertCurrentNativeBuild, rpcProbeInputs } from './native-inputs.mjs'
import { assertPortabilityArtifact } from './portability-proof.mjs'
const root = resolve(import.meta.dirname, '../..')
const portable = existsSync(join(root, 'portability-source.json'))
const work = portable ? resolve(process.env.XPLAT_NIM_PORTABILITY_CACHE ?? join(root, 'research/nim-portability')) : join(root, 'research/nim-cli')
const binary = join(work, `${portable ? 'bin' : 'native'}/rpc-probe${process.platform === 'win32' ? '.exe' : ''}`)
if (portable) {assertPortabilityArtifact(root, JSON.parse(readFileSync(join(work, 'rpc-build-result.json'))), readFileSync(binary), 'tools/cli-nim/rpc_probe.nim')}
else {assertCurrentNativeBuild(root, JSON.parse(readFileSync(join(work, 'native/rpc-build.json'))), readFileSync(binary), rpcProbeInputs)}
const scratch = scratchRun(root, 'rpc'), owned = new Set(), evidence = []
const windows = process.platform === 'win32'
const supportedHost = { skip: !['darwin', 'linux', 'win32'].includes(process.platform) }
const posixHost = { skip: !['darwin', 'linux'].includes(process.platform) }
let sequence = 0
const socketPath = () => windows ? `\\\\.\\pipe\\xplat-rpc-${randomUUID()}` : join(scratch, `${++sequence}.sock`)
function probe(request) {
 const stopFile = windows && request.operation === 'server' ? join(scratch, `stop-${randomUUID()}`) : undefined
 const child = spawn(binary, [], { env: { ...process.env, PATH: '', NODE_PATH: '', NODE_OPTIONS: '' }, stdio: ['pipe', 'pipe', 'pipe'] })
 let stdout = '', stderr = '', readyResolve, readyReject
 const ready = new Promise((resolve, reject) => { readyResolve = resolve; readyReject = reject })
 const timer = setTimeout(() => { readyReject(Error('Native server did not become ready')); child.kill('SIGKILL') }, 5000)
 const closed = new Promise((resolve, reject) => {
  child.once('error', error => { clearTimeout(timer); readyReject(error); reject(error) })
  child.once('close', (code, signal) => {
   clearTimeout(timer)
   if (!stdout.includes('ready\n')) {readyReject(Error(stderr || `Native process exited ${code}`))}
   evidence.push({ request, code, signal, stdout, stderr })
   resolve({ code, signal, stdout, stderr })
  })
 })
 ready.catch(() => {}) // Client probes do not emit a readiness line.
 child.stdout.on('data', chunk => {
  stdout += chunk
  if (stdout.includes('ready\n')) { clearTimeout(timer); readyResolve() }
 })
 child.stderr.on('data', chunk => { stderr += chunk })
 child.stdin.end(JSON.stringify({ ...request, ...(stopFile ? { stopFile } : {}) }) + '\n')
 const fixture = { child, ready, closed, stop: async () => {
  if (child.exitCode === null && child.signalCode === null) {
   if (stopFile) {writeFileSync(stopFile, '')} else {child.kill('SIGTERM')}
  }
  let timeout
  try {
   return await Promise.race([closed, new Promise((_, reject) => { timeout = setTimeout(() => { child.kill('SIGKILL'); reject(Error('Native server did not close')) }, 2000) })])
  } finally { clearTimeout(timeout); owned.delete(fixture) }
 } }
 owned.add(fixture)
 closed.finally(() => owned.delete(fixture)).catch(() => {})
 return fixture
}
after(async () => {
 for (const fixture of owned) {await fixture.stop()}
 writeFileSync(join(work, 'rpc-differential.json'), JSON.stringify({ platform: process.platform, node: process.version, exchanges: evidence }, null, 2)+'\n')
 rmSync(scratch, { recursive: true, force: true })
})
async function nativeClient(path, payload, options = {}) {
 const { closed } = probe({ operation: 'client', path, payload, ...options })
 const result = await closed
 assert.equal(result.code, 0, result.stderr)
 assert.equal(result.signal, null)
 assert.equal(result.stderr, '')
 return JSON.parse(result.stdout)
}
async function withNativeServer(options, run) {
 const path = socketPath()
 if (!windows) {assert.ok(Buffer.byteLength(path) < 104)}
 const fixture = probe({ operation: 'server', path, ...options })
 try { await fixture.ready; return await run(path, fixture) }
 finally {
  const result = await fixture.stop()
  assert.equal(result.code, 0, result.stderr)
  assert.equal(result.stderr, '')
 }
}
function nodeCall(path, data) {
 return new Promise((resolve, reject) => {
  const socket = connect(path)
  let pending = '', settled = false
  const timer = setTimeout(() => finish(Error('Node peer timed out')), 3000)
  function finish(error, value) {
   if (settled) {return}
   settled = true; clearTimeout(timer); socket.destroy()
   if (error) {reject(error);} else {resolve(value)}
  }
  socket.setEncoding('utf8')
  socket.once('error', error => finish(error))
  socket.once('end', () => finish(Error('Peer ended before a reply')))
  socket.once('connect', async () => {
   try {
    if (Array.isArray(data)) {for (const part of data) { socket.write(part); await new Promise(resolve => setImmediate(resolve)) }}
    else {socket.write(data)}
   } catch (error) { finish(error) }
  })
  socket.on('data', chunk => {
   pending += chunk
   const end = pending.indexOf('\n')
   if (end >= 0) { try { finish(null, JSON.parse(pending.slice(0, end))) } catch (error) { finish(error) } }
  })
 })
}
async function withNodeServer(handler, run, path = socketPath()) {
 const peers = new Set()
 const server = createServer(peer => {
  peers.add(peer); peer.on('error', () => {}); peer.once('close', () => peers.delete(peer))
  handler(peer)
 })
 await new Promise((resolve, reject) => { server.once('error', reject); server.listen(path, resolve) })
 try { return await run(path, server) }
 finally { for (const peer of peers) {peer.destroy();} await new Promise(resolve => server.close(resolve)) }
}

test('native client and server interoperate with Node over fragmented UTF-8 NDJSON', supportedHost, async () => {
 const payload = { method: 'echo', params: { text: '🛰️ café\u0000\nline', lone: '\ud800' } }
 await withNativeServer({}, async path => {
  const encoded = Buffer.from(JSON.stringify(payload) + '\n')
  const fragmented = [...encoded].map(byte => Buffer.from([byte]))
  assert.deepEqual(await nodeCall(path, fragmented), { ok: true, result: payload })
  assert.deepEqual(await nativeClient(path, payload), { ok: true, result: payload })
  const failed = await nodeCall(path, '{"fail":true}\n')
  assert.equal(failed.error.code, 'prerequisite_missing')
  assert.equal(failed.error.recovery.action, 'Install fixture')
 })
 await withNodeServer(peer => {
  peer.setEncoding('utf8'); let input = ''
  peer.on('data', chunk => {
   input += chunk
   if (input.includes('\n')) {peer.end(JSON.stringify({ ok: true, result: JSON.parse(input.trim()) }) + '\n')}
  })
 }, async path => assert.deepEqual(await nativeClient(path, payload), { ok: true, result: payload }))
})

test('request framing rejects malformed, primitive and oversized input while the listener stays usable', supportedHost, async () => {
 await withNativeServer({ requestLimit: 1024 }, async path => {
  for (const data of ['{bad}\n', 'null\n', '[]\n', '42\n', JSON.stringify({ text: 'x'.repeat(2048) }) + '\n']) {
   const reply = await nodeCall(path, data)
   assert.equal(reply.ok, false)
   assert.equal(reply.error.code, 'invalid_selection')
  }
  assert.deepEqual(await nodeCall(path, '{"alive":true}\n'), { ok: true, result: { alive: true } })
  assert.deepEqual(await nodeCall(path, '{"first":true}\n{"second":true}\n'), { ok: true, result: { first: true } })
 })
 await withNativeServer({ requestLimit: 4096, responseLimit: 1024 }, async path => {
  const reply = await nodeCall(path, JSON.stringify({ text: 'x'.repeat(2048) }) + '\n')
  assert.equal(reply.error.code, 'execution_failure')
 })
})

test('native client reports bad replies, byte bounds, missing endpoints and read deadlines', supportedHost, async () => {
 for (const body of ['{bad}\n', 'null\n', '{"ok":"true"}\n', 'x'.repeat(2048) + '\n']) {
  await withNodeServer(peer => peer.once('data', () => peer.end(body)), async path => {
   const reply = await nativeClient(path, { method: 'ping' }, { responseLimit: 1024 })
   assert.equal(reply.ok, false)
   assert.equal(reply.error.code, 'execution_failure')
  })
 }
 await withNodeServer(() => {}, async path => {
  const reply = await nativeClient(path, { method: 'ping' }, { timeoutMs: 40 })
  assert.equal(reply.error.code, 'timeout')
 })
 const absent = await nativeClient(socketPath(), { method: 'ping' })
 assert.equal(absent.error.code, 'disconnected_runtime')
 const bounded = await nativeClient(socketPath(), { text: 'x'.repeat(2048) }, { requestLimit: 1024 })
 assert.equal(bounded.error.code, 'invalid_selection')
 const nul = await nativeClient(socketPath() + '\0suffix', {})
 assert.equal(nul.error.code, 'invalid_selection')
})

test('pending peers and connection pressure are bounded and shutdown drains idle reads', supportedHost, async () => {
 await withNativeServer({ peerLimit: 1, timeoutMs: 5000 }, async (path, fixture) => {
  const held = connect(path); held.on('error', () => {})
  await new Promise((resolve, reject) => { held.once('connect', resolve); held.once('error', reject) })
  try {
   const busy = await nativeClient(path, {})
   assert.equal(busy.error.code, 'unavailable')
   const result = await fixture.stop()
   assert.equal(result.code, 0, result.stderr)
   assert.equal(existsSync(path), false)
  } finally { held.destroy() }
 })
 await withNativeServer({ timeoutMs: 40 }, async path => {
  await assert.rejects(nodeCall(path, '{'), /Peer ended before a reply/)
  assert.deepEqual(await nodeCall(path, '{"alive":true}\n'), { ok: true, result: { alive: true } })
 })
})

test('listener ownership preserves existing files, live sockets and replacement inodes', posixHost, async () => {
 const regular = socketPath(); writeFileSync(regular, 'user-owned data')
 const failure = probe({ operation: 'server', path: regular })
 const failed = await failure.closed
 assert.equal(failed.code, 1)
 assert.equal(readFileSync(regular, 'utf8'), 'user-owned data')
 await withNodeServer(peer => peer.once('data', () => peer.end('{"ok":true,"result":"original"}\n')), async path => {
  const collision = probe({ operation: 'server', path })
  assert.equal((await collision.closed).code, 1)
  assert.equal((await nodeCall(path, '{}\n')).result, 'original')
 })
 await withNativeServer({}, async (path, fixture) => {
  unlinkSync(path)
  await withNodeServer(peer => peer.once('data', () => peer.end('{"ok":true,"result":"replacement"}\n')), async () => {
   assert.equal((await fixture.stop()).code, 0)
   assert.equal(existsSync(path), true)
   assert.equal((await nodeCall(path, '{}\n')).result, 'replacement')
  }, path)
 })
})

test('repeated and concurrent peers close their descriptors without listener growth', supportedHost, async () => {
 const exec = promisify(execFile)
 const count = async pid => {
  if (windows) {
   const { stdout } = await exec('powershell.exe', ['-NoProfile','-NonInteractive','-Command', `(Get-Process -Id ${Number(pid)}).HandleCount`])
   return Number(stdout.trim())
  }
  if (process.platform === 'linux') {return readdirSync(`/proc/${pid}/fd`).length}
  const { stdout } = await exec('/usr/sbin/lsof', ['-nP', '-p', String(pid), '-Ff'])
  return stdout.split('\n').filter(line => /^f\d+$/.test(line)).length
 }
 await withNativeServer({ timeoutMs: 5000, peerLimit: 32 }, async (path, fixture) => {
  const before = await count(fixture.child.pid)
  for (let batch = 0; batch < 20; batch++) {
   const replies = await Promise.all(Array.from({ length: 8 }, (_, index) => nodeCall(path, JSON.stringify({ batch, index }) + '\n')))
   assert.ok(replies.every(reply => reply.ok))
  }
  await delay(20)
  const after = await count(fixture.child.pid)
  assert.ok(after <= before + 1, `Socket descriptors grew from ${before} to ${after}`)
 })
})


test('Windows first-instance ownership preserves existing listeners and releases its own endpoint', { skip: !windows }, async () => {
 await withNodeServer(peer => peer.once('data', () => peer.end('{"ok":true,"result":"original"}\n')), async path => {
  const collision = probe({ operation: 'server', path })
  assert.equal((await collision.closed).code, 1)
  assert.equal((await nodeCall(path, '{}\n')).result, 'original')
 })
 await withNativeServer({}, async (path, fixture) => {
  const collision = probe({ operation: 'server', path })
  assert.equal((await collision.closed).code, 1)
  assert.equal((await nativeClient(path, {}, { ownerOnly: true })).ok, true)
  assert.equal((await fixture.stop()).code, 0)
  const replacement = probe({ operation: 'server', path })
  try {
   await replacement.ready
   assert.equal((await nodeCall(path, '{}\n')).ok, true)
  } finally {assert.equal((await replacement.stop()).code, 0)}
 })
})
test('Windows private clients reject untrusted endpoint security before sending request bytes', { skip: !windows }, async () => {
 let bytes = 0
 await withNodeServer(peer => peer.on('data', data => {bytes += data.length}), async path => {
  const result = await nativeClient(path, { token: 'public-fixture-token' }, { ownerOnly: true })
  assert.equal(result.error.code, 'permission_denied')
  assert.equal(bytes, 0)
 })
 for (const path of ['relative', '\\\\remote\\pipe\\not-local', socketPath()+'\\child', socketPath()+'\0suffix']) {
  assert.equal((await nativeClient(path, {})).error.code, 'invalid_selection')
 }
})
test('Windows client write deadlines cancel stalled pipe I/O before releasing buffers', { skip: !windows }, async () => {
 await withNodeServer(peer => peer.pause(), async path => {
  const reply = await nativeClient(path, { text: 'x'.repeat(512*1024) }, { connectMs: 40 })
  assert.equal(reply.error.code, 'timeout')
  assert.equal(reply.error.message, 'RPC write did not complete in time.')
 })
})
test('Windows shutdown cancels an observed pending reply while the client stays paused', { skip: !windows }, async () => {
 await withNativeServer({ timeoutMs: 5000 }, async (path, fixture) => {
  const peer = connect(path)
  peer.on('error', () => {})
  const started = new Promise((resolve, reject) => {
   const timer = setTimeout(() => reject(Error('No native reply bytes observed')), 2000)
   peer.once('data', data => {peer.pause(); clearTimeout(timer); resolve(data.length)})
   peer.once('connect', () => peer.write(JSON.stringify({ replyBytes: 4*1024*1024 })+'\n'))
   peer.once('error', error => {clearTimeout(timer); reject(error)})
  })
  try {
   assert.ok(await started > 0)
   // This independent peer must stay responsive while the first write is blocked.
   assert.equal((await nativeClient(path, { alive: true })).ok, true)
   const result = await fixture.stop()
   assert.equal(result.code, 0, result.stderr)
  } finally {peer.destroy()}
 })
})
