// Real Vite middleware + canonical app registry on the macOS host. No browser/UI.
import assert from 'node:assert/strict'
import { test, before, after } from 'node:test'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { createHash } from 'node:crypto'
import { createConnection } from 'node:net'
import { createServer as httpServer } from 'node:http'
import { mkdirSync, readFileSync, writeFileSync, existsSync, readdirSync, realpathSync, rmSync, symlinkSync, utimesSync, chmodSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { homedir } from 'node:os'
import { setTimeout as delay } from 'node:timers/promises'
import { createServer } from 'vite'
import { xplatDevBridge } from '../../packages/cli/dist/vite.js'
import { createDevActionsService } from '../../packages/cli/src/mcp/actions/service.ts'
import { scratchRun } from './scratch.mjs'
import { assertCurrentNativeBuild } from './native-inputs.mjs'

const macOnly = { skip: process.platform === 'darwin' ? false : 'Native action control is qualified on macOS only' }
const root = resolve(import.meta.dirname, '../..'), binary = join(root, 'research/nim-cli/native/xplat' + (process.platform === 'win32' ? '.exe' : ''))
assertCurrentNativeBuild(root, JSON.parse(readFileSync(join(root, 'research/nim-cli/native/build.json'))), readFileSync(binary))
const scratch = scratchRun(root, 'actions'), appRoot = join(scratch, 'project 雪'), runtimeDirs = new Set()
const bridgeDir = join(appRoot, 'node_modules/.cache/xplat/dev-bridge')
const environment = { ...process.env, XPLAT_AGENT_CLIENT: '', XPLAT_PERMISSIONS: '', XPLAT_AGENT_HOST_IDLE_MS: '2000', TMPDIR: scratch }
let server, endpoint, registry, appBridge, nativeHost
const handles = [], controls = new Map(), received = []
const state = { counter: 0, running: 0, maxRunning: 0 }
const workerPids = join(scratch, 'worker-pids')
function file(path, bytes) { mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, bytes) }
function json(path, value) { file(path, JSON.stringify(value)) }
function hostPaths(project) {
 const key = createHash('sha256').update(realpathSync(project)).digest('hex').slice(0, 32)
 const directory = join(homedir(), '.cache/octane-xplat/nim-hosts', key)
 runtimeDirs.add(directory)
 return { directory, descriptor: join(directory, 'host.json'), socket: join(homedir(), '.cache/octane-xplat/nim-ipc', key + '.sock') }
}
async function until(predicate, message, timeout = 8000) {
 const end = Date.now() + timeout
 while (Date.now() < end) { if (await predicate()) {return;} await delay(10) }
 assert.fail(message)
}
function alive(pid) { try { process.kill(pid, 0); return true } catch (error) { if (error.code === 'ESRCH') {return false;} throw error } }
async function cli(args, { project = appRoot, env = {}, expectedCode = 0, raw = false } = {}) {
 const child = spawn(binary, [...args, '--project', project, ...(raw ? [] : ['--json'])], { cwd: root, env: { ...environment, ...env }, stdio: ['ignore', 'pipe', 'pipe'] })
 let stdout = '', stderr = ''
 child.stdout.on('data', bytes => { stdout += bytes }); child.stderr.on('data', bytes => { stderr += bytes })
 const exited = once(child, 'exit'), timer = setTimeout(() => child.kill('SIGTERM'), 20000)
 try {
  const [code] = await exited
  assert.equal(code, expectedCode, stderr || stdout)
  assert.equal(stderr, '')
  return raw ? stdout : JSON.parse(stdout)
 } finally {
  clearTimeout(timer)
  if (child.exitCode === null && child.signalCode === null) { child.kill('SIGTERM'); await exited }
 }
}
function rpc(project, method, params = {}, grants = ['runtime-actions']) {
 const paths = hostPaths(project), descriptor = JSON.parse(readFileSync(paths.descriptor))
 assert.equal(descriptor.workspaceRoot, realpathSync(project))
 return new Promise((resolve, reject) => {
  const socket = createConnection(paths.socket)
  const timer = setTimeout(() => { socket.destroy(); reject(Error('Action RPC timed out')) }, 12000)
  let bytes = ''
  socket.on('error', reject); socket.once('close', () => clearTimeout(timer))
  socket.once('connect', () => socket.write(JSON.stringify({ token: descriptor.token, method, params, appId: '.', grants }) + '\n'))
  socket.on('data', data => { bytes += data; if (bytes.includes('\n')) { socket.destroy(); resolve(JSON.parse(bytes.split('\n')[0])) } })
 })
}
async function finish(jobId) {
 let reply
 await until(async () => {
  reply = await cli(['actions', 'status', jobId])
  return !['queued', 'running', 'cancelling'].includes(reply.data.job.state)
 }, 'Action job must reach a terminal state', 12000)
 return reply.data
}
async function invoke(action, input = {}, extra = []) {
 const result = await cli(['actions', 'invoke', '--action', action, '--instance', appBridge.instanceId, '--input', JSON.stringify(input), ...extra])
 assert.equal(result.ok, true)
 nativeHost = JSON.parse(readFileSync(hostPaths(appRoot).descriptor))
 return result.data
}
async function bridgePost(path, body) {
 const response = await fetch(endpoint.url + '/__xplat_dev__' + path, { method: 'POST', headers: { 'content-type': 'application/json', 'x-xplat-dev-token': endpoint.token }, body: JSON.stringify(body) })
 assert.equal(response.status, 200); return response.json()
}
function declaration(id, override = {}) {
 return { id, title: id, description: 'Owned native CLI qualification fixture', effects: { summary: 'Change fixture state only' }, ...override }
}
function hold(input, context) {
 received.push({ id: context.requestId, kind: 'hold' }); state.running++; state.maxRunning = Math.max(state.maxRunning, state.running)
 context.reportPartialEffect('fixture hold entered')
 return new Promise((resolve, reject) => {
  controls.set(context.requestId, () => { controls.delete(context.requestId); state.running--; resolve({ total: state.counter }) })
  context.signal.addEventListener('abort', () => { if (controls.delete(context.requestId)) { state.running--; reject(Error('fixture cancelled')) } }, { once: true })
 })
}

before(async () => {
 if (macOnly.skip) {return}
 const nodeBin = join(scratch, 'bin'), quote = value => "'" + value.replaceAll("'", "'\\''") + "'"
 file(join(nodeBin, 'node'), `#!/bin/sh\nprintf '%s\\n' "$$" >> ${quote(workerPids)}\nexec ${quote(process.execPath)} "$@"\n`)
 chmodSync(join(nodeBin, 'node'), 0o700)
 environment.PATH = nodeBin + ':' + environment.PATH
 json(join(appRoot, 'package.json'), { name: 'native-actions-fixture', type: 'module', xplat: { targets: { macos: { runtime: 'appkit-node-api' } } } })
 mkdirSync(join(appRoot, 'node_modules/@octane-xplat'), { recursive: true })
 symlinkSync(join(root, 'packages/cli'), join(appRoot, 'node_modules/@octane-xplat/cli'))
 const plugin = xplatDevBridge({ appRoot })
 const registryFile = join(root, 'packages/platform/src/dev-actions-registry.ts')
 server = await createServer({ root: appRoot, configFile: false, logLevel: 'silent', plugins: [plugin, {
  name: 'fixture-macos-leaf', enforce: 'pre', resolveId(id, importer) {
   if (id === './dev-bridge' && importer?.split('?')[0] === registryFile) {return join(root, 'packages/platform/src/dev-bridge.macos.ts')}
  },
 }], server: { host: '127.0.0.1', port: 0 } })
 await server.listen()
 const name = readdirSync(bridgeDir).find(name => name.endsWith('.json'))
 endpoint = JSON.parse(readFileSync(join(bridgeDir, name)))
 globalThis.__XPLAT_DEV_BRIDGE__ = { token: endpoint.token }
 globalThis.__XPLAT_DEV_ORIGIN__ = endpoint.url
 registry = await server.ssrLoadModule(registryFile)
 handles.push(registry.registerDevAction(declaration('fixture.increment', {
  input: { fields: { amount: { type: 'integer', default: 1, minimum: 1, maximum: 3 } } }, result: { fields: { total: { type: 'integer' } } },
  run: ({ amount }, context) => { received.push({ id: context.requestId, kind: 'increment' }); state.counter += amount; return { total: state.counter } },
 })))
 handles.push(registry.registerDevAction(declaration('fixture.hold', { result: { fields: { total: { type: 'integer' } } }, execution: { cancellable: true }, run: hold })))
 handles.push(registry.registerDevAction(declaration('fixture.overlap', { result: { fields: { total: { type: 'integer' } } }, execution: { cancellable: true, concurrency: 'overlap' }, run: hold })))
 handles.push(registry.registerDevAction(declaration('fixture.external', { effects: { summary: 'Simulated external effect in owned fixture', externalEffects: true }, run: () => ({}) })))
 handles.push(registry.registerDevAction(declaration('fixture.unavailable', { availability: { ready: false, reason: 'fixture paused' }, run: () => ({}) })))
 appBridge = registry.startDevActionBridge({ appLabel: 'Owned macOS registry', intervalMs: 100 })
 await until(async () => {
  const response = await fetch(endpoint.url + '/__xplat_dev__/registry', { headers: { 'x-xplat-dev-token': endpoint.token } })
  return (await response.json()).instances.length === 1
 }, 'Canonical app bridge must announce a real registry')
})

after(async () => {
 if (macOnly.skip) { rmSync(scratch, { recursive: true, force: true }); return }
 for (const release of controls.values()) {release()}
 if (nativeHost && alive(nativeHost.pid)) {
  await rpc(appRoot, 'host.shutdown')
  await until(() => !alive(nativeHost.pid), 'Test-owned native host must exit after releasing actions')
 }
 appBridge?.stop(); for (const handle of handles) {handle.dispose()}
 await server?.close()
 delete globalThis.__XPLAT_DEV_BRIDGE__; delete globalThis.__XPLAT_DEV_ORIGIN__
 for (const directory of runtimeDirs) {rmSync(directory, { recursive: true, force: true })}
 rmSync(scratch, { recursive: true, force: true })
})

test('native list discovers real app declarations without Node and never starts a host', macOnly, async () => {
 const paths = hostPaths(appRoot)
 assert.equal(existsSync(paths.descriptor), false)
 const actual = await cli(['actions', 'list'], { env: { PATH: '' } })
 assert.equal(actual.data.state, 'live')
 assert.equal(actual.data.instances[0].platform, 'macos')
 const capabilities = (await cli(['capabilities'], { env: { PATH: '' } })).data.capabilities
 const native = capabilities.find(row => row.platform === 'macos').capabilities.find(row => row.capability === 'dev_actions')
 assert.equal(native.status, 'supported'); assert.match(native.detail, /Node/)
 const reference = createDevActionsService({ jobs: {}, policy: {} })
 const expected = JSON.parse(JSON.stringify(await reference.list({ root: appRoot })))
 for (const view of [actual.data, expected]) {for (const instance of view.instances) {
  assert.ok(Math.abs(Date.parse(instance.announcedAt) - Date.now()) < 5000)
  instance.announcedAt = '<recent announcement>'
 }}
 assert.deepEqual(actual.data, expected)
 assert.equal(existsSync(paths.descriptor), false)
 assert.ok(!JSON.stringify(actual.data).includes(endpoint.token))
 const human = await cli(['actions', 'list'], { env: { PATH: '' }, raw: true })
 assert.match(human, /fixture.increment/)
})

test('public invocation validates defaults and follows a real canonical app action through job/result status', macOnly, async () => {
 const before = state.counter
 const started = await invoke('fixture.increment')
 assert.equal(started.action.id, 'fixture.increment')
 const completed = await finish(started.job.jobId)
 assert.equal(completed.job.state, 'succeeded')
 assert.equal(completed.job.result.outcome.result.total, before + 1)
 assert.equal(completed.requestId, started.requestId)
 assert.equal(completed.instanceKey, endpoint.serverId + '/' + appBridge.instanceId)
 assert.equal((await cli(['job', 'status', started.job.jobId])).data.job.jobId, started.job.jobId)
 assert.equal(state.counter, before + 1)
})

test('invalid input, unavailable actions, stale revisions and external effects are rejected before dispatch', macOnly, async () => {
 const count = received.length
 for (const [flags, code, exit] of [
  [['--action', 'fixture.increment', '--input', '{"amount":"bad"}'], 'invalid_selection', 2],
  [['--action', 'fixture.increment', '--input', '{"extra":1}'], 'invalid_selection', 2],
  [['--action', 'fixture.increment', '--revision', '0'], 'stale_identity', 5],
  [['--action', 'fixture.unavailable'], 'unavailable', 3],
  [['--action', 'fixture.external'], 'permission_denied', 4],
  [['--action', 'fixture.missing'], 'invalid_selection', 2],
 ]) {
  const result = await cli(['actions', 'invoke', ...flags], { expectedCode: exit })
  assert.equal(result.error.code, code)
 }
 const denied = await rpc(appRoot, 'devActions.invoke', { actionId: 'fixture.increment', input: {} }, [])
 assert.equal(denied.error.code, 'permission_denied')
 assert.equal(received.length, count)
 const allowed = await cli(['actions', 'invoke', '--action', 'fixture.external'], { env: { XPLAT_PERMISSIONS: 'external-effects' } })
 assert.equal((await finish(allowed.data.job.jobId)).job.state, 'succeeded')
})

test('request keys deduplicate live work, reject changed inputs, and recover bridge outcomes without rerunning', macOnly, async () => {
 const key = 'request / ? é😀', count = received.length
 const first = await invoke('fixture.hold', {}, ['--request-key', key])
 await until(() => controls.has(first.requestId), 'Hold action must be dispatched')
 const duplicate = await invoke('fixture.hold', {}, ['--request-key', key])
 assert.equal(duplicate.deduplicated, true); assert.equal(duplicate.job.jobId, first.job.jobId)
 assert.match(first.requestId, /^req_[a-f0-9]{32}$/)
 controls.get(first.requestId)()
 assert.equal((await finish(first.job.jobId)).job.state, 'succeeded')
 const repeated = await invoke('fixture.hold', {}, ['--request-key', key])
 assert.equal((await finish(repeated.job.jobId)).job.state, 'succeeded')
 assert.equal(repeated.requestId, first.requestId)
 assert.equal(received.length, count + 1)
 const seeded = await invoke('fixture.increment', { amount: 1 }, ['--request-key', 'changed-input'])
 await finish(seeded.job.jobId)
 const changed = await cli(['actions', 'invoke', '--action', 'fixture.increment', '--input', '{"amount":2}', '--request-key', 'changed-input'], { expectedCode: 2 })
 assert.equal(changed.error.code, 'invalid_selection')
})

test('serialized cancellation never dispatches queued work and keeps the following slot behind its owner', macOnly, async () => {
 const first = await invoke('fixture.hold')
 await until(() => controls.has(first.requestId), 'First hold must own the slot')
 const second = await invoke('fixture.hold'), third = await invoke('fixture.hold')
 assert.equal(controls.has(second.requestId), false); assert.equal(controls.has(third.requestId), false)
 await cli(['job', 'cancel', second.job.jobId])
 assert.equal((await finish(second.job.jobId)).job.state, 'cancelled')
 await delay(50)
 assert.equal(controls.has(third.requestId), false)
 controls.get(first.requestId)(); await finish(first.job.jobId)
 await until(() => controls.has(third.requestId), 'Third hold must get the released slot')
 controls.get(third.requestId)(); await finish(third.job.jobId)
 assert.ok(!received.some(item => item.id === second.requestId))
})

test('declared overlap and bounded serialized queues retain per-instance policy and dedupe at capacity', macOnly, async () => {
 const first = await invoke('fixture.overlap'), second = await invoke('fixture.overlap')
 await until(() => controls.has(first.requestId) && controls.has(second.requestId), 'Overlap actions must both enter')
 controls.get(first.requestId)(); controls.get(second.requestId)(); await finish(first.job.jobId); await finish(second.job.jobId)
 const waiting = []
 for (let i = 0; i < 8; i++) {waiting.push(await invoke('fixture.hold', {}, ['--request-key', 'capacity-' + i]))}
 const dedup = await invoke('fixture.hold', {}, ['--request-key', 'capacity-0'])
 assert.equal(dedup.deduplicated, true)
 const overflow = await cli(['actions', 'invoke', '--action', 'fixture.hold'], { expectedCode: 3 })
 assert.equal(overflow.error.code, 'target_busy')
 for (const job of waiting) {await cli(['job', 'cancel', job.job.jobId])}
 for (const job of waiting) {assert.equal((await finish(job.job.jobId)).job.state, 'cancelled')}
})

test('output validation and structured handler failures disclose effects without claiming rollback', macOnly, async () => {
 const started = await invoke('fixture.hold')
 await until(() => controls.has(started.requestId), 'Hold must be executing')
 await bridgePost('/result', { requestId: started.requestId, outcome: { requestId: started.requestId, status: 'succeeded', result: { total: 'wrong' }, partialEffects: ['fixture already changed'] } })
 const completed = await finish(started.job.jobId)
 assert.equal(completed.job.state, 'failed')
 assert.match(completed.job.error.message, /not undone/)
 assert.deepEqual(completed.job.error.context.partialEffects, ['fixture already changed'])
 controls.get(started.requestId)()
 const handle = registry.registerDevAction(declaration('fixture.fail', { run: (input, context) => { context.reportPartialEffect('fixture touched'); throw Error('fixture handler error') } }))
 handles.push(handle)
 await delay(150)
 const failed = await invoke('fixture.fail')
 const result = await finish(failed.job.jobId)
 assert.equal(result.job.state, 'failed')
 assert.deepEqual(result.job.error.context.partialEffects, ['fixture touched'])
 assert.match(JSON.stringify(result.job.error), /fixture handler error/)
})

test('a queued action is not dispatched after the registry revision changes', macOnly, async () => {
 const first = await invoke('fixture.hold')
 await until(() => controls.has(first.requestId), 'First hold must run')
 const queued = await invoke('fixture.hold')
 handles.push(registry.registerDevAction(declaration('fixture.new-revision', { run: () => ({}) })))
 await delay(150)
 controls.get(first.requestId)(); await finish(first.job.jobId)
 const result = await finish(queued.job.jobId)
 assert.equal(result.job.state, 'failed'); assert.equal(result.job.error.code, 'stale_identity')
 assert.equal(result.job.error.context.outcome, 'not-run')
 assert.ok(!received.some(item => item.id === queued.requestId))
})

test('instance ambiguity with an optional app label fails before selecting or invoking an app', macOnly, async () => {
 const current = (await cli(['actions', 'list'])).data.instances[0]
 await bridgePost('/registry', { protocol: 'xplat-dev-actions', version: 1, appInstanceId: 'extra-instance', platform: 'web', revision: 1, announcedAt: new Date().toISOString(), actions: current.actions.map(({ liveAvailability: _liveAvailability, ...action }) => action) })
 const ambiguous = await cli(['actions', 'invoke', '--action', 'fixture.increment'], { expectedCode: 2 })
 assert.equal(ambiguous.error.code, 'ambiguous_selection')
 assert.equal(ambiguous.error.context.candidates.length, 2)
 assert.equal(ambiguous.error.context.candidates.find(value => value.appInstanceId === 'extra-instance').appLabel, null)
})

test('missing project worker fails clearly while listing remains native and readable', macOnly, async () => {
 const missing = join(scratch, 'missing-worker')
 json(join(missing, 'package.json'), { name: 'missing-worker', xplat: { targets: { macos: { runtime: 'appkit-node-api' } } } })
 json(join(missing, 'node_modules/.cache/xplat/dev-bridge/fixture.json'), { ...endpoint, appRoot: missing })
 const listed = await cli(['actions', 'list'], { project: missing, env: { PATH: '' } })
 assert.equal(listed.data.state, 'live')
 const result = await cli(['actions', 'invoke', '--action', 'fixture.increment', '--instance', appBridge.instanceId], { project: missing, expectedCode: 3, env: { NODE_PATH: join(root, 'node_modules') } })
 assert.equal(result.error.code, 'prerequisite_missing'); assert.match(result.error.message, /Install @octane-xplat\/cli/)
 const descriptor = JSON.parse(readFileSync(hostPaths(missing).descriptor))
 await rpc(missing, 'host.shutdown'); await until(() => !alive(descriptor.pid), 'Missing-worker host must stop')
})

test('session file scope, stale files, symlinks and inventory overflow never create a guessed destination', macOnly, async () => {
 const selected = join(scratch, 'endpoint-safety')
 json(join(selected, 'package.json'), { name: 'endpoint-safety', xplat: { targets: { macos: { runtime: 'appkit-node-api' } } } })
 const cache = join(selected, 'node_modules/.cache/xplat/dev-bridge')
 const foreign = join(scratch, 'foreign.json'); json(foreign, { ...endpoint, appRoot: selected })
 mkdirSync(cache, { recursive: true }); symlinkSync(foreign, join(cache, 'link.json'))
 json(join(cache, 'wrong-app.json'), { ...endpoint, appRoot })
 json(join(cache, 'remote.json'), { ...endpoint, appRoot: selected, url: 'https://example.invalid' })
 const stale = join(cache, 'stale.json'); json(stale, { ...endpoint, appRoot: selected, pid: -1 }); utimesSync(stale, 1, 1)
 const writable = join(cache, 'writable.json'); json(writable, { ...endpoint, appRoot: selected }); chmodSync(writable, 0o666)
 assert.equal((await cli(['actions', 'list'], { project: selected, env: { PATH: '' } })).data.state, 'no-bridge')
 for (let i = 0; i < 260; i++) {file(join(cache, 'junk-' + i), '')}
 const overflow = await cli(['actions', 'list'], { project: selected, expectedCode: 3 })
 assert.equal(overflow.error.code, 'unavailable')
})

test('cooperative cancellation preserves reported partial effects and queued cancellation records not-run', macOnly, async () => {
 const first = await invoke('fixture.hold')
 await until(() => controls.has(first.requestId), 'Running action must be dispatched')
 const queued = await invoke('fixture.hold')
 await cli(['job', 'cancel', queued.job.jobId])
 const unrun = await finish(queued.job.jobId)
 assert.equal(unrun.job.result.outcome.notRun, true)
 assert.deepEqual(unrun.job.result.outcome.partialEffects, [])
 await cli(['job', 'cancel', first.job.jobId])
 const cancelled = await finish(first.job.jobId)
 assert.equal(cancelled.job.state, 'cancelled')
 assert.deepEqual(cancelled.job.result.outcome.partialEffects, ['fixture hold entered'])
 assert.equal(cancelled.job.result.outputValidation, 'not-performed-after-cancellation')
})

test('timeouts and disconnect outcomes remain unknown and are never silently retried', macOnly, async () => {
 handles.push(registry.registerDevAction(declaration('fixture.deadline', { result: { fields: { total: { type: 'integer' } } }, execution: { cancellable: true, timeoutMs: 150 }, run: hold })))
 await delay(150)
 const timed = await invoke('fixture.deadline')
 const result = await finish(timed.job.jobId)
 assert.equal(result.job.state, 'failed'); assert.equal(result.job.error.code, 'timeout')
 assert.equal(result.job.error.context.outcome, 'unknown')
 await until(() => !controls.has(timed.requestId), 'Timeout must request cooperative cancellation')
 const unknown = await invoke('fixture.hold')
 await until(() => controls.has(unknown.requestId), 'Unknown-outcome fixture must run')
 await bridgePost('/result', { requestId: unknown.requestId, outcome: { status: 'unknown', error: { code: 'disconnected_runtime' } } })
 const disconnected = await finish(unknown.job.jobId)
 assert.equal(disconnected.job.state, 'failed'); assert.equal(disconnected.job.error.code, 'disconnected_runtime')
 assert.equal(disconnected.job.error.context.outcome, 'unknown')
 assert.equal(received.filter(item => item.id === unknown.requestId).length, 1)
 controls.get(unknown.requestId)()
 const cancelled = await invoke('fixture.hold')
 await until(() => controls.has(cancelled.requestId), 'Missing-partial-effects fixture must run')
 await bridgePost('/result', { requestId: cancelled.requestId, outcome: { status: 'cancelled' } })
 const missing = await finish(cancelled.job.jobId)
 assert.equal(missing.job.error.code, 'cancelled')
 assert.equal(missing.job.error.context.partialEffects, null)
 controls.get(cancelled.requestId)()
 const mismatched = await invoke('fixture.hold')
 await until(() => controls.has(mismatched.requestId), 'Mismatched-result fixture must run')
 await bridgePost('/result', { requestId: mismatched.requestId, outcome: { requestId: 'some-other-request', status: 'succeeded', result: { total: 1 } } })
 const rejected = await finish(mismatched.job.jobId)
 assert.equal(rejected.job.state, 'failed'); assert.equal(rejected.job.error.context.outcome, 'unknown')
 controls.get(mismatched.requestId)()
})

test('bridge redirects never forward the token and oversized registry bodies fail boundedly', macOnly, async () => {
 let forwarded = 0, mode = 'redirect'
 const sink = httpServer((request, response) => { forwarded++; response.end('{}') })
 await new Promise(resolve => sink.listen(0, '127.0.0.1', resolve))
 const source = httpServer((request, response) => {
  if (mode === 'redirect') { response.writeHead(302, { location: 'http://127.0.0.1:' + sink.address().port + '/leak' }); response.end() }
  else { response.writeHead(200, { 'content-type': 'application/json' }); response.end(JSON.stringify({ instances: [], pad: 'x'.repeat(1024 * 1024) })) }
 })
 await new Promise(resolve => source.listen(0, '127.0.0.1', resolve))
 const project = join(scratch, 'http-safety')
 json(join(project, 'package.json'), { name: 'http-safety', xplat: { targets: { macos: { runtime: 'appkit-node-api' } } } })
 json(join(project, 'node_modules/.cache/xplat/dev-bridge/local.json'), { ...endpoint, appRoot: project, url: 'http://127.0.0.1:' + source.address().port })
 try {
  const redirected = await cli(['actions', 'list'], { project, env: { PATH: '' } })
  assert.equal(redirected.data.state, 'bridge-unreachable'); assert.match(redirected.data.detail, /redirect refused/)
  assert.equal(forwarded, 0)
  mode = 'large'
  const large = await cli(['actions', 'list'], { project, env: { PATH: '' } })
  assert.equal(large.data.state, 'bridge-unreachable'); assert.match(large.data.detail, /byte limit/)
  assert.ok(!JSON.stringify(large).includes(endpoint.token))
 } finally {
  source.closeAllConnections(); sink.closeAllConnections()
  await Promise.all([new Promise(resolve => source.close(resolve)), new Promise(resolve => sink.close(resolve))])
 }
})

test('pathological JS regex validation is bounded, leaves the host responsive, and is reaped on shutdown', macOnly, async () => {
 handles.push(registry.registerDevAction(declaration('fixture.regex-bound', {
  input: { fields: { text: { type: 'string', pattern: '^(a+)+$' } } },
  run: () => { received.push({ kind: 'must-not-run' }); return {} },
 })))
 await delay(150)
 const args = ['actions', 'invoke', '--action', 'fixture.regex-bound', '--instance', appBridge.instanceId,
  '--input', JSON.stringify({ text: 'a'.repeat(32) + '!' })]
 const count = received.length
 const timed = await cli(args, { expectedCode: 7 })
 assert.equal(timed.error.code, 'timeout')
 assert.equal(received.length, count)
 const before = readFileSync(workerPids, 'utf8').trim().split('\n').length
 const pending = cli(args, { expectedCode: 8 })
 await until(() => readFileSync(workerPids, 'utf8').trim().split('\n').length > before, 'Validation worker must be launched')
 nativeHost = JSON.parse(readFileSync(hostPaths(appRoot).descriptor))
 const started = Date.now(), ping = await rpc(appRoot, 'host.ping')
 assert.equal(ping.ok, true); assert.ok(Date.now() - started < 1000)
 await rpc(appRoot, 'host.shutdown')
 const cancelled = await pending
 assert.equal(cancelled.error.code, 'cancelled')
 await until(() => !alive(nativeHost.pid), 'Native shutdown must await validator teardown')
 for (const pid of readFileSync(workerPids, 'utf8').trim().split('\n').map(Number)) {assert.equal(alive(pid), false)}
 assert.equal(received.length, count)
 assert.ok(!readdirSync(scratch).some(name => name.startsWith('xplat-worker-')), 'Owned worker request/result staging must be removed')
})
