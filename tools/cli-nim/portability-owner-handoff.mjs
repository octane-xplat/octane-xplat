// Invoke start and verify in separate host/SSH sessions, through Turbo.
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { readFileSync, writeFileSync, existsSync, rmSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { createConnection } from 'node:net'
import { setTimeout as delay } from 'node:timers/promises'
import { scratchRun } from './scratch.mjs'
import { assertPortabilityArtifact, verifyPortabilitySource } from './portability-proof.mjs'

const root = resolve(import.meta.dirname, '../..')
const source = verifyPortabilitySource(root)
const phase = process.argv[2]
assert.ok(['start', 'verify'].includes(phase), 'Choose start or verify in separate host sessions')
const work = resolve(process.env.XPLAT_NIM_PORTABILITY_CACHE ?? join(root, 'research/nim-portability'))
const extension = process.platform === 'win32' ? '.exe' : ''
const binary = join(work, 'bin/xplat'+extension), probe = join(work, 'bin/host-probe'+extension)
for (const [file, record, entry] of [[binary,'build-result.json','packages/cli/nim/main.nim'], [probe,'host-build-result.json','tools/cli-nim/host_probe.nim']]) {
 assertPortabilityArtifact(root, JSON.parse(readFileSync(join(work, record))), readFileSync(file), entry)
}
const statePath = join(work, 'owner-handoff.json')
const environment = { ...process.env, PATH: '', NODE_OPTIONS: '', NODE_PATH: '', XPLAT_AGENT_HOST_IDLE_MS: '20000' }
function call(request) {
 const result = spawnSync(probe, [], { input: JSON.stringify(request)+'\n', env: environment, encoding: 'utf8', timeout: 10000 })
 assert.equal(result.status, 0, result.stderr || result.error?.message)
 const value = JSON.parse(result.stdout); assert.equal(value.ok ?? true, true, JSON.stringify(value)); return value
}
function rpc(descriptor, method) {
 return new Promise((resolve, reject) => {
  const socket = createConnection(descriptor.socketPath)
  let output = '', settled = false
  const timer = setTimeout(() => finish(Error('Owner handoff RPC deadline')), 5000)
  function finish(error, value) {
   if (settled) {return}; settled = true; clearTimeout(timer); socket.destroy()
   if (error) {reject(error)} else {resolve(value)}
  }
  socket.once('error', error => finish(error))
  socket.once('end', () => finish(Error('Owner ended before reply')))
  socket.once('connect', () => socket.write(JSON.stringify({ token: descriptor.token, method, params: {} })+'\n'))
  socket.on('data', bytes => {
   output += bytes
   if (output.includes('\n')) {try {finish(null, JSON.parse(output.split('\n')[0]))} catch (error) {finish(error)}}
  })
 })
}
function alive(pid) {try {process.kill(pid, 0); return true} catch (error) {if (error.code === 'ESRCH') {return false}; throw error}}
if (phase === 'start') {
 assert.ok(!existsSync(statePath) || JSON.parse(readFileSync(statePath)).phase === 'passed', 'Resolve the previous owned handoff before starting another')
 const project = scratchRun(root, 'owner-handoff')
 writeFileSync(join(project, 'package.json'), JSON.stringify({ name: 'native-owner-handoff', private: true, xplat: { targets: { web: {} } } }))
 const paths = call({ operation: 'paths', root: project })
 assert.equal(call({ operation: 'ensure', root: project, executable: binary }).ok, true)
 const descriptor = JSON.parse(readFileSync(paths.descriptor))
 assert.equal(descriptor.identity.name, '@octane-xplat/cli')
 const ping = await rpc(descriptor, 'host.ping'); assert.equal(ping.ok, true)
 // Credentials remain only in the native private descriptor, never this evidence.
 const state = { phase: 'started', project, descriptorPath: paths.descriptor, pid: descriptor.pid, startedAt: descriptor.startedAt,
  ownerId: ping.result.ownerId, sourceManifestSha256: source.sha256, firstClient: process.pid, at: Date.now() }
 writeFileSync(statePath, JSON.stringify(state, null, 2)+'\n')
 console.log(JSON.stringify(state))
} else {
 const state = JSON.parse(readFileSync(statePath))
 assert.equal(state.phase, 'started'); assert.equal(state.sourceManifestSha256, source.sha256)
 assert.notEqual(process.pid, state.firstClient); assert.equal(alive(state.firstClient), false, 'First client must have exited')
 const descriptor = JSON.parse(readFileSync(state.descriptorPath))
 assert.equal(descriptor.workspaceRoot, state.project); assert.equal(descriptor.pid, state.pid); assert.equal(descriptor.startedAt, state.startedAt)
 try {
  const ping = await rpc(descriptor, 'host.ping')
  assert.equal(ping.ok, true); assert.equal(ping.result.ownerId, state.ownerId)
  const publicClient = spawnSync(binary, ['session','list','--project',state.project,'--json'], { encoding: 'utf8', env: environment, timeout: 8000 })
  assert.equal(publicClient.status, 0, publicClient.stderr); assert.deepEqual(JSON.parse(publicClient.stdout).data, { sessions: [] })
 } finally {
  assert.equal((await rpc(descriptor, 'host.shutdown')).ok, true)
  const deadline = Date.now()+6000
  while (alive(state.pid) && Date.now()<deadline) {await delay(10)}
  assert.equal(alive(state.pid), false); assert.equal(existsSync(state.descriptorPath), false)
 }
 rmSync(dirname(state.descriptorPath), { recursive: true, force: true })
 rmSync(state.project, { recursive: true, force: true })
 const result = { ...state, phase: 'passed', secondClient: process.pid, survivedMs: Date.now()-state.at, authenticatedShutdown: true }
 writeFileSync(statePath, JSON.stringify(result, null, 2)+'\n'); console.log(JSON.stringify(result))
}
