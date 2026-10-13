// Runtime service (item D): targets, build/launch/attach, logs, ownership
// and cleanup against stub adapters — plus real spawn/kill coverage for the
// process plumbing.

import assert from 'node:assert/strict'
import { test } from 'node:test'
import { join } from 'node:path'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import { createXplatMcpServer } from '../src/server.mjs'
import { createWorkspaceContext } from '../src/status.mjs'
import { createLogBuffer } from '../src/runtime/logs.mjs'
import { spawnManaged } from '../src/runtime/process.mjs'
import { androidDevices, hostBlock, iosSimulators } from '../src/runtime/targets.mjs'
import { createRuntimeService } from '../src/runtime/service.mjs'
import { makeConsumerApp, makeWorkspace } from './helpers.mjs'

const boundContext = (options = {}) => {
	const root = makeWorkspace()
	makeConsumerApp(root, '.', { name: 'rt-app' })
	return createWorkspaceContext({
		workspaceRoot: root,
		evidenceRoot: join(root, '.ev'),
		...options,
	})
}

/** A stub platform adapter — no real toolchain involved. */
function stubAdapter(overrides = {}) {
	return {
		platform: 'web',
		describe: async () => [{ capability: 'launch', status: 'supported' }],
		discoverTargets: async () => ({
			targets: [{ targetId: 'web', name: 'stub web', kind: 'browser', availability: 'available' }],
		}),
		build: async () => ({ summary: 'stub build ok', buildIdentity: { revision: 'stub' } }),
		launch: async ({ claim, logs }) => {
			let stopped = false
			claim({
				describe: () => 'stub process',
				dispose: async () => {
					stopped = true
					return 'stub process stopped'
				},
			})

			logs.note('stub launch ran')
			return {
				detail: 'stub ready',
				processKind: 'fresh',
				readiness: 'confirmed',
				buildIdentity: { revision: 'stub' },
				stopped: () => stopped,
			}
		},
		attachables: async () => [],
		...overrides,
	}
}

const serviceWith = (adapterOverrides, contextOptions = {}) => {
	const context = boundContext(contextOptions)
	const adapters = new Map([['web', stubAdapter(adapterOverrides)]])
	context.runtime = createRuntimeService(context, { adapters, exec: () => '1.0.0\n' })
	return { context, runtime: context.runtime }
}

const waitForJob = async (jobs, jobId, state = 'succeeded') => {
	for (let i = 0; i < 100; i += 1) {
		const job = jobs.status(jobId)
		if (job.state === state || ['failed', 'cancelled'].includes(job.state)) {
			return job
		}

		await new Promise((r) => setTimeout(r, 20))
	}

	throw new Error(`job ${jobId} did not reach ${state}`)
}

// ---------- log buffer ----------

test('log buffer is bounded, cursor-paginated, and reports truncation', () => {
	const logs = createLogBuffer({ limit: 5 })
	for (let i = 1; i <= 8; i += 1) {
		logs.append({ stream: 'stdout', line: `line ${i}` })
	}

	const tail = logs.read()
	assert.equal(tail.records.length, 5)
	assert.equal(tail.records[0].line, 'line 4')

	const page = logs.read({ cursor: tail.nextCursor })
	assert.equal(page.records.length, 0)
	assert.equal(page.truncated, false)

	const stale = logs.read({ cursor: 1 })
	assert.equal(stale.truncated, true)
	assert.equal(stale.dropped, 3)

	logs.reset('tap restarted')
	const after = logs.read()
	assert.ok(after.reset)
	assert.match(after.reset.reason, /tap restarted/)
})

// ---------- managed processes ----------

test('spawnManaged captures output lines and stops the process group', async (t) => {
	const logs = createLogBuffer()
	const child = spawnManaged({
		cmd: process.execPath,
		args: ['-e', 'console.log("hello"); setInterval(()=>{}, 1000)'],
		logBuffer: logs,
	})

	t.after(() => child.stop())
	assert.ok(child.pid)
	const deadline = Date.now() + 5000
	while (!logs.read().records.some((rec) => rec.line === 'hello') && Date.now() < deadline) {
		await new Promise((r) => setTimeout(r, 20))
	}

	assert.ok(logs.read().records.some((rec) => rec.line === 'hello'))

	await child.stop()
	const { code, signal } = await child.exit
	assert.ok(code === null || code !== 0 || signal, `expected a stop, got code=${code}`)
	assert.ok(logs.read().records.some((rec) => rec.line.includes('exited')))
})

test('spawnManaged abort signal stops the child cooperatively', async () => {
	const logs = createLogBuffer()
	const controller = new AbortController()
	const child = spawnManaged({
		cmd: process.execPath,
		args: ['-e', 'setInterval(()=>{}, 1000)'],
		logBuffer: logs,
		signal: controller.signal,
	})

	controller.abort()
	const { signal } = await child.exit
	assert.equal(signal, 'SIGTERM')
})

// ---------- target discovery ----------

test('iosSimulators parses simctl output, booted first', () => {
	const exec = () =>
		JSON.stringify({
			devices: {
				'com.apple.CoreSimulator.SimRuntime.iOS-26-0': [
					{ udid: 'A', name: 'iPhone 17', state: 'Shutdown', isAvailable: true },
					{ udid: 'B', name: 'iPhone 16', state: 'Booted', isAvailable: true },
					{ udid: 'C', name: 'iPad', state: 'Shutdown', isAvailable: false },
				],
			},
		})

	const { targets } = iosSimulators({ exec })
	assert.equal(targets.length, 2)
	assert.equal(targets[0].targetId, 'B')
	assert.equal(targets[0].booted, true)
	assert.equal(targets[1].targetId, 'A')
	assert.match(targets[1].name, /iOS 26\.0/)
})

test('iosSimulators reports missing toolchain honestly', () => {
	const { targets, reason } = iosSimulators({ exec: () => null })
	assert.equal(targets.length, 0)
	assert.match(reason, /xcrun simctl/)
})

test('androidDevices parses adb output and ignores offline entries', () => {
	const exec = () =>
		'List of devices attached\nemulator-5554\tdevice\nab12cd\toffline\npixel-9\tdevice\n'

	const { targets } = androidDevices({ exec })
	assert.deepEqual(
		targets.map((t) => [t.targetId, t.kind]),
		[
			['emulator-5554', 'emulator'],
			['pixel-9', 'device'],
		],
	)
})

test('hostBlock gates ios/macos to darwin and windows to win32', () => {
	assert.equal(hostBlock('ios', 'darwin'), null)
	assert.match(hostBlock('ios', 'linux'), /macOS host/)
	assert.match(hostBlock('windows', 'darwin'), /Windows host/)
	assert.equal(hostBlock('web', 'linux'), null)
	assert.match(hostBlock('linux', 'darwin'), /Linux host/)
})

// ---------- service: targets, launch, attach, logs, cleanup ----------

test('launch binds an owned session, runs a job, and marks readiness', async () => {
	const { context, runtime } = serviceWith()
	const result = await runtime.launch({ platform: 'web' })
	assert.equal(result.deduplicated, false)
	assert.equal(result.session.ownership, 'owned')

	const job = await waitForJob(context.jobs, result.job.jobId)
	assert.equal(job.state, 'succeeded')
	assert.equal(job.result.detail, 'stub ready')

	const session = context.sessions.get(result.session.sessionId)
	assert.equal(session.state, 'ready')
	assert.equal(session.processKind, 'fresh')
	assert.equal(session.buildIdentity.revision, 'stub')

	// Job evidence carries the launch provenance.
	const ev = context.evidence.list({ kind: 'job' })
	assert.equal(ev.length, 1)
	assert.equal(ev[0].provenance.sessionId, session.sessionId)
	assert.equal(ev[0].provenance.platform, 'web')
})

test('a second launch on the same target is busy while the session lives', async () => {
	const { context, runtime } = serviceWith()
	const first = await runtime.launch({ platform: 'web' })
	await waitForJob(context.jobs, first.job.jobId)

	const second = await runtime.launch({ platform: 'web' })
	assert.equal(second.error.code, 'target_busy')
	assert.equal(second.error.context.sessionId, first.session.sessionId)
})

test('launch dedupe: an in-flight launch for the same target returns the live job', async () => {
	let release
	const gate = new Promise((r) => (release = r))
	const { runtime } = serviceWith({
		launch: async () => {
			await gate
			return { detail: 'slow ready', processKind: 'fresh' }
		},
	})

	const first = await runtime.launch({ platform: 'web', requestKey: 'k1' })
	const second = await runtime.launch({ platform: 'web', requestKey: 'k1' })
	assert.equal(second.deduplicated, true)
	assert.equal(second.job.jobId, first.job.jobId)

	release()
})

test('failed launch ends the session and reports the failure', async () => {
	const { context, runtime } = serviceWith({
		launch: async () => {
			throw Object.assign(new Error('boom'), { code: 'execution_failure' })
		},
	})

	const { session, job } = await runtime.launch({ platform: 'web' })
	const done = await waitForJob(context.jobs, job.jobId)
	assert.equal(done.state, 'failed')
	assert.equal(context.sessions.get(session.sessionId).state, 'stopped')
})

test('session end releases owned resources; attached sessions are preserved', async () => {
	const { context, runtime } = serviceWith({
		attachables: async () => [
			{ targetId: 'web:5200', name: 'dev :5200', processKind: 'warm', detail: 'found' },
		],
		attach: async ({ claim, logs }) => {
			claim({
				describe: () => 'stub log tap',
				dispose: async () => 'tap stopped',
			})

			logs.note('attached')
			return { detail: 'attached' }
		},
	})

	// Owned session: cleanup disposes claimed resources through the registry.
	const owned = await runtime.launch({ platform: 'web' })
	await waitForJob(context.jobs, owned.job.jobId)
	const ended = await runtime.endSession(owned.session.sessionId)
	assert.equal(ended.ended, true)
	assert.deepEqual(ended.released, ['stub process stopped'])

	// Attached session: user's app is preserved, but our tap is still released.
	const attached = await runtime.attach({ platform: 'web' })
	assert.equal(attached.session.ownership, 'attached')
	const endedAttached = await runtime.endSession(attached.session.sessionId)
	assert.equal(endedAttached.ended, true)
	assert.match(endedAttached.preserved[0], /user-owned/)
})

test('attach reports none/ambiguous/invalid selections honestly', async () => {
	const noneCtx = serviceWith()
	const none = await noneCtx.runtime.attach({ platform: 'web' })
	assert.equal(none.error.code, 'not_found')

	const two = serviceWith({
		attachables: async () => [
			{ targetId: 'web:1', name: 'one' },
			{ targetId: 'web:2', name: 'two' },
		],
	})

	const ambiguous = await two.runtime.attach({ platform: 'web' })
	assert.equal(ambiguous.error.code, 'ambiguous_selection')
	const invalid = await two.runtime.attach({ platform: 'web', targetId: 'web:9' })
	assert.equal(invalid.error.code, 'invalid_selection')
})

test('logs read sessions and build jobs with cursors and honest gaps', async () => {
	const { context, runtime } = serviceWith({
		launch: async ({ logs }) => {
			for (let i = 0; i < 3; i += 1) {
				logs.append({ stream: 'stdout', line: `app line ${i}` })
			}

			return { detail: 'ready', processKind: 'fresh' }
		},
	})

	const { session, job } = await runtime.launch({ platform: 'web' })
	await waitForJob(context.jobs, job.jobId)

	const page = runtime.readLogs({ sessionId: session.sessionId })
	assert.ok(page.records.length >= 3)
	assert.ok(page.records.some((r) => r.line === 'app line 1'))

	const continued = runtime.readLogs({ sessionId: session.sessionId, cursor: page.nextCursor })
	assert.equal(continued.records.length, 0)

	const missing = runtime.readLogs({ sessionId: 'sess_nope' })
	assert.equal(missing.error.code, 'not_found')

	const build = await runtime.build({ platform: 'web' })
	await waitForJob(context.jobs, build.job.jobId)
	const buildLogs = runtime.readLogs({ jobId: build.job.jobId })
	assert.ok(Array.isArray(buildLogs.records))
})

test('build dedupe by requestKey and target selection validation', async () => {
	const { context, runtime } = serviceWith({
		discoverTargets: async () => ({
			targets: [
				{ targetId: 'a', name: 'A' },
				{ targetId: 'b', name: 'B' },
			],
		}),
	})

	const first = await runtime.build({ platform: 'web', requestKey: 'rk' })
	const second = await runtime.build({ platform: 'web', requestKey: 'rk' })
	assert.equal(second.deduplicated, true)
	assert.equal(second.job.jobId, first.job.jobId)
	await waitForJob(context.jobs, first.job.jobId)

	// Multiple targets require an explicit pick.
	const ambiguous = await runtime.launch({ platform: 'web' })
	assert.equal(ambiguous.error.code, 'ambiguous_selection')

	const bad = await runtime.launch({ platform: 'web', targetId: 'nope' })
	assert.equal(bad.error.code, 'invalid_selection')

	const undeclared = await runtime.launch({ platform: 'ios' })
	assert.equal(undeclared.error.code, 'invalid_selection')
	assert.match(undeclared.error.message, /does not declare/)
})

test('launch job cancellation stops the session cooperatively', async () => {
	let disposed = false
	const { context, runtime } = serviceWith({
		launch: async ({ claim, signal }) => {
			claim({
				describe: () => 'slow launch',
				dispose: async () => {
					disposed = true
					return 'slow launch stopped'
				},
			})

			await new Promise((resolve, reject) => {
				signal.addEventListener('abort', () =>
					reject(Object.assign(new Error('cancelled'), { name: 'AbortError' })),
				)
			})
		},
	})

	const { session, job } = await runtime.launch({ platform: 'web' })
	context.jobs.cancel(job.jobId)
	const done = await waitForJob(context.jobs, job.jobId)
	assert.equal(done.state, 'cancelled')
	assert.equal(disposed, true)
	assert.equal(context.sessions.get(session.sessionId).state, 'stopped')
})

test('project status shows runtime-backed capabilities once adapters register', async () => {
	const root = makeWorkspace()
	makeConsumerApp(root, '.', { name: 'cap-rt' })
	const context = createWorkspaceContext({
		workspaceRoot: root,
		evidenceRoot: join(root, '.ev'),
		runtime: { exec: () => '1.0.0\n' },
	})

	const { server } = createXplatMcpServer(context)
	const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()
	const client = new Client({ name: 'test', version: '0' })
	await Promise.all([server.connect(serverTransport), client.connect(clientTransport)])

	const result = await client.callTool({ name: 'xplat_targets', arguments: {} })
	assert.ok(!result.isError)
	assert.equal(result.structuredContent.data.platforms[0].platform, 'web')
	assert.equal(result.structuredContent.data.platforms[0].targets[0].targetId, 'web')
})
