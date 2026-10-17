// Development-action registry: contract validators plus the full wire path —
// a real dev-bridge middleware, a simulated dev app announcing/polling, and a
// real MCP client listing and invoking through the tools.

import assert from 'node:assert/strict'
import http from 'node:http'
import { test } from 'node:test'
import { realpathSync } from 'node:fs'
import { join } from 'node:path'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import { xplatDevBridge } from '../../cli/src/mcp/dev-bridge.ts'
import {
	actionAvailability,
	isDevActionAnnouncement,
	validateActionDeclaration,
	validateActionInput,
	validateActionOutput,
} from '../dist/contracts/actions.js'

import { scanBridgeEndpoints } from '../dist/actions/bridge.js'
import { createXplatMcpServer } from '../dist/server.js'
import { createWorkspaceContext } from '../dist/status.js'
import { makeConsumerApp, makeWorkspace } from './helpers.mjs'

// ---------- contract validators ----------

test('declaration validation catches missing metadata and bad contracts', () => {
	assert.ok(validateActionDeclaration({}).length > 0)
	assert.ok(
		validateActionDeclaration({
			id: 'auth.login',
			title: 'Log in',
			description: 'x',
			effects: { summary: 'signs in' },
			input: { fields: { role: { type: 'string', pattern: '(' } } },
		}).some((p) => p.includes('pattern')),
	)

	assert.equal(
		validateActionDeclaration({
			id: 'auth.login',
			title: 'Log in',
			description: 'x',
			effects: { summary: 'signs in' },
		}).length,
		0,
	)
})

test('input validation applies defaults, checks types and rejects undeclared fields', () => {
	const contract = {
		fields: {
			scenario: { type: 'string', enum: ['small', 'large-feed'] },
			scale: { type: 'integer', minimum: 1, maximum: 10_000, default: 100 },
			deep: { type: 'object', fields: { seed: { type: 'integer' } } },
		},
	}

	const good = validateActionInput(contract, { scenario: 'large-feed', deep: { seed: 4 } })
	assert.equal(good.ok, true)
	assert.deepEqual(good.value, { scenario: 'large-feed', scale: 100, deep: { seed: 4 } })

	assert.equal(validateActionInput(contract, { scenario: 'huge' }).ok, false)
	assert.equal(validateActionInput(contract, { scenario: 'small', scale: 0 }).ok, false)
	assert.equal(validateActionInput(contract, { scenario: 'small', extra: 1 }).ok, false)
	assert.equal(validateActionInput(contract, 'string').ok, false)
	// No arguments is valid.
	assert.deepEqual(validateActionInput(undefined, undefined), { ok: true, value: {} })
})

test('output validation enforces the declared result contract', () => {
	const contract = { fields: { count: { type: 'integer' }, seed: { type: 'integer' } } }
	assert.equal(validateActionOutput(contract, { count: 1000, seed: 7 }).ok, true)
	assert.equal(validateActionOutput(contract, { count: 'many' }).ok, false)
})

test('availability reasons: platform mismatch and app-reported unready', () => {
	const action = {
		id: 'a.b',
		availability: { platforms: ['ios'], ready: false, reason: 'needs mock server' },
	}

	assert.deepEqual(actionAvailability(action, 'web'), {
		ready: false,
		reason: 'not applicable on web',
	})

	assert.deepEqual(actionAvailability(action, 'ios'), { ready: false, reason: 'needs mock server' })
	assert.deepEqual(actionAvailability({ id: 'a.b' }, 'web'), { ready: true })
	assert.equal(
		isDevActionAnnouncement({
			protocol: 'xplat-dev-actions',
			appInstanceId: 'x',
			revision: 0,
			actions: [],
		}),
		true,
	)
})

// ---------- wire fixtures ----------

async function makeBridge(t, appRoot) {
	const plugin = xplatDevBridge({ appRoot })
	const token = JSON.parse(plugin.config().define.__XPLAT_DEV_BRIDGE__).token
	let middleware
	const server = http.createServer((req, res) =>
		middleware(req, res, () => {
			res.statusCode = 404
			res.end()
		}),
	)

	plugin.configureServer({
		middlewares: { use: (fn) => (middleware = fn) },
		config: { root: appRoot, server: {} },
		httpServer: server,
	})

	await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
	const apps = []
	t.after(async () => {
		for (const app of apps) {
			app.stop()
		}

		server.closeAllConnections?.()
		await new Promise((resolve) => server.close(resolve))
	})

	const origin = `http://127.0.0.1:${server.address().port}`
	const call = (method, path, body) => {
		const init = { method, headers: { 'x-xplat-dev-token': token } }
		if (body) {
			init.headers['content-type'] = 'application/json'
			init.body = JSON.stringify(body)
		}

		return fetch(`${origin}/__xplat_dev__${path}`, init).then((r) => r.json())
	}

	return { origin, token, call, server, apps }
}

/** Simulated dev app: announces a registry, polls for work, posts outcomes. */
function makeApp(bridge, { instanceId, platform = 'web', actions = [], handle }) {
	const state = { revision: 1, actions, running: new Map(), stop: false, calls: [] }

	const announce = () =>
		bridge.call('POST', '/registry', {
			protocol: 'xplat-dev-actions',
			version: 1,
			appInstanceId: instanceId,
			platform,
			revision: state.revision,
			announcedAt: new Date().toISOString(),
			actions: state.actions,
		})

	const postOutcome = (requestId, outcome) => bridge.call('POST', '/result', { requestId, outcome })

	const poll = async () => {
		while (!state.stop) {
			let work
			try {
				work = await bridge.call('GET', `/poll?instance=${instanceId}&wait=200`)
			} catch {
				return
			}

			for (const request of work.invocations ?? []) {
				void (async () => {
					state.calls.push(request)
					const run = { cancelled: false }
					state.running.set(request.requestId, run)
					try {
						const outcome = await handle(request, run)
						await postOutcome(request.requestId, outcome)
					} catch (error) {
						await postOutcome(request.requestId, {
							requestId: request.requestId,
							status: run.cancelled ? 'cancelled' : 'failed',
							error: { code: 'execution_failure', message: String(error?.message ?? error) },
							completedAt: new Date().toISOString(),
						})
					} finally {
						state.running.delete(request.requestId)
					}
				})()
			}

			for (const requestId of work.cancel ?? []) {
				const run = state.running.get(requestId)
				if (run) {
					run.cancelled = true
				}
			}
		}
	}

	const app = {
		state,
		async start() {
			await announce()
			void poll()
		},
		announce,
		stop() {
			state.stop = true
		},
	}

	bridge.apps?.push(app)
	return app
}

const actionDeclaration = (over = {}) => ({
	id: 'auth.login-as-test-admin',
	title: 'Log in as test admin',
	description: 'Signs in a privileged test user; returns the role, never credentials.',
	input: {},
	result: { fields: { role: { type: 'string' } } },
	effects: { summary: 'changes the active test session', auth: true },
	...over,
})

async function connect(root, options = {}) {
	const context = createWorkspaceContext({
		workspaceRoot: root,
		evidenceRoot: join(root, '.ev'),
		...options,
	})

	const { server } = createXplatMcpServer(context)
	const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()
	const client = new Client({ name: 'test-client', version: '0.0.0' })
	await Promise.all([server.connect(serverTransport), client.connect(clientTransport)])
	return { client, context }
}

const callTool = (client, name, args = {}) =>
	client.callTool({ name, arguments: args }).then((r) => r.structuredContent)

const jobDone = async (client, jobId, timeoutMs = 10_000) => {
	const deadline = Date.now() + timeoutMs
	while (Date.now() < deadline) {
		const { data } = await callTool(client, 'xplat_job_status', { jobId })
		if (['succeeded', 'failed', 'cancelled'].includes(data.job.state)) {
			return data.job
		}

		await new Promise((resolve) => setTimeout(resolve, 25))
	}

	throw new Error(`job ${jobId} did not finish`)
}

// ---------- listing ----------

test('list distinguishes no bridge, no instance, live, and empty registries', async (t) => {
	const root = makeWorkspace()
	makeConsumerApp(root, '.', { name: 'actions-app' })

	// No dev server running → no-bridge, never a claimed registry.
	{
		const { client } = await connect(root)
		const list = await callTool(client, 'xplat_dev_actions')
		assert.equal(list.data.state, 'no-bridge')
	}

	const bridge = await makeBridge(t, root)
	{
		const { client } = await connect(root)
		// Bridge up but nothing announced → no-instance (not an empty registry).
		const list = await callTool(client, 'xplat_dev_actions')
		assert.equal(list.data.state, 'no-instance')

		// An app announcing zero actions is a live, empty registry.
		const empty = makeApp(bridge, { instanceId: 'inst_empty', actions: [] })
		await empty.start()
		const listed = await callTool(client, 'xplat_dev_actions')
		assert.equal(listed.data.state, 'live')
		assert.equal(listed.data.instances[0].actions.length, 0)
		empty.stop()
	}
})

test('a consumer app declares two actions; the agent lists both with contracts and availability', async (t) => {
	const root = makeWorkspace()
	makeConsumerApp(root, '.', { name: 'actions-app' })
	const bridge = await makeBridge(t, root)
	const app = makeApp(bridge, {
		instanceId: 'inst_main',
		actions: [
			actionDeclaration(),
			actionDeclaration({
				id: 'performance.prepare-scenario',
				title: 'Prepare performance scenario',
				description: 'Loads a fixture dataset before measurement.',
				input: {
					fields: {
						scenario: { type: 'string', enum: ['large-feed'] },
						scale: { type: 'integer', default: 1000, minimum: 1 },
					},
				},
				result: {
					fields: {
						scenario: { type: 'string' },
						count: { type: 'integer' },
						seed: { type: 'integer' },
					},
				},
				effects: { summary: 'loads fixture data', testData: true },
				availability: { ready: false, reason: 'fixture service offline' },
			}),
		],
		handle: async () => ({
			requestId: '',
			status: 'succeeded',
			result: { role: 'admin' },
			completedAt: '',
		}),
	})

	await app.start()

	const { client } = await connect(root)
	const list = await callTool(client, 'xplat_dev_actions')
	assert.equal(list.data.state, 'live')

	const [instance] = list.data.instances
	assert.equal(instance.appInstanceId, 'inst_main')
	assert.equal(instance.platform, 'web')
	assert.equal(instance.revision, 1)
	assert.equal(instance.actions.length, 2)

	const [login, perf] = instance.actions
	assert.equal(login.id, 'auth.login-as-test-admin')
	assert.equal(login.effects.auth, true)
	assert.equal(perf.effects.testData, true)
	assert.equal(perf.liveAvailability.ready, false)
	assert.equal(perf.liveAvailability.reason, 'fixture service offline')
})

// ---------- invocation ----------

test('invocation validates input, runs, and returns the validated result', async (t) => {
	const root = makeWorkspace()
	makeConsumerApp(root, '.', { name: 'actions-app' })
	const bridge = await makeBridge(t, root)
	const app = makeApp(bridge, {
		instanceId: 'inst_main',
		actions: [
			actionDeclaration({
				id: 'performance.prepare-scenario',
				input: { fields: { scale: { type: 'integer', default: 1000 } } },
				result: { fields: { count: { type: 'integer' }, seed: { type: 'integer' } } },
			}),
		],
		handle: async (request) => ({
			requestId: request.requestId,
			status: 'succeeded',
			result: { count: request.input.scale, seed: 42 },
			completedAt: new Date().toISOString(),
		}),
	})

	await app.start()

	const { client } = await connect(root)
	const list = await callTool(client, 'xplat_dev_actions')

	// Invalid input is rejected before anything reaches the app.
	const bad = await callTool(client, 'xplat_dev_action_invoke', {
		actionId: 'performance.prepare-scenario',
		input: { scale: 'lots', bogus: 1 },
		registryRevision: list.data.instances[0].revision,
	})

	assert.equal(bad.ok, false)
	assert.equal(bad.error.code, 'invalid_selection')
	assert.equal(app.state.calls.length, 0)

	// Defaults are applied; stale revisions are rejected.
	const stale = await callTool(client, 'xplat_dev_action_invoke', {
		actionId: 'performance.prepare-scenario',
		registryRevision: 99,
	})

	assert.equal(stale.error.code, 'stale_identity')
	assert.equal(app.state.calls.length, 0)

	const invoked = await callTool(client, 'xplat_dev_action_invoke', {
		actionId: 'performance.prepare-scenario',
		registryRevision: 1,
	})

	assert.equal(invoked.ok, true)
	assert.equal(invoked.data.job.kind, 'dev-action')

	const job = await jobDone(client, invoked.data.job.jobId)
	assert.equal(job.state, 'succeeded')
	assert.equal(job.result.outcome.status, 'succeeded')
	// The app saw the applied default; the agent sees the validated result.
	assert.equal(app.state.calls[0].input.scale, 1000)
	assert.deepEqual(job.result.outcome.result, { count: 1000, seed: 42 })
})

test('wrong instance, unknown action and unavailable actions are rejected pre-execution', async (t) => {
	const root = makeWorkspace()
	makeConsumerApp(root, '.', { name: 'actions-app' })
	const bridge = await makeBridge(t, root)
	const app = makeApp(bridge, {
		instanceId: 'inst_main',
		actions: [actionDeclaration({ availability: { platforms: ['ios'] } })],
		handle: async () => ({}),
	})

	await app.start()

	const { client } = await connect(root)

	const missing = await callTool(client, 'xplat_dev_action_invoke', {
		appInstanceId: 'inst_ghost',
		actionId: 'auth.login-as-test-admin',
	})

	assert.equal(missing.error.code, 'not_found')

	const unknown = await callTool(client, 'xplat_dev_action_invoke', { actionId: 'does.not-exist' })
	assert.equal(unknown.error.code, 'invalid_selection')

	const unavailable = await callTool(client, 'xplat_dev_action_invoke', {
		actionId: 'auth.login-as-test-admin',
	})

	assert.equal(unavailable.error.code, 'unavailable')
	assert.match(unavailable.error.message, /not applicable on web/)
	assert.equal(app.state.calls.length, 0)
})

test('multiple instances never share an invocation target silently', async (t) => {
	const root = makeWorkspace()
	makeConsumerApp(root, '.', { name: 'actions-app' })
	const bridge = await makeBridge(t, root)
	const a = makeApp(bridge, {
		instanceId: 'inst_a',
		actions: [actionDeclaration()],
		handle: async () => ({}),
	})

	const b = makeApp(bridge, {
		instanceId: 'inst_b',
		actions: [actionDeclaration()],
		handle: async () => ({}),
	})

	await a.start()
	await b.start()

	const { client } = await connect(root)
	const invoked = await callTool(client, 'xplat_dev_action_invoke', {
		actionId: 'auth.login-as-test-admin',
	})

	assert.equal(invoked.error.code, 'ambiguous_selection')
	assert.equal(invoked.error.context.candidates.length, 2)
	assert.equal(a.state.calls.length + b.state.calls.length, 0)
})

test('request identity dedupes: a retried call returns the live job', async (t) => {
	const root = makeWorkspace()
	makeConsumerApp(root, '.', { name: 'actions-app' })
	const bridge = await makeBridge(t, root)
	let release
	const app = makeApp(bridge, {
		instanceId: 'inst_main',
		actions: [actionDeclaration()],
		handle: (request) =>
			new Promise((resolve) => {
				release = () =>
					resolve({
						requestId: request.requestId,
						status: 'succeeded',
						result: { role: 'admin' },
						completedAt: new Date().toISOString(),
					})
			}),
	})

	await app.start()

	const { client } = await connect(root)
	const first = await callTool(client, 'xplat_dev_action_invoke', {
		actionId: 'auth.login-as-test-admin',
		requestKey: 'login-once',
	})

	const second = await callTool(client, 'xplat_dev_action_invoke', {
		actionId: 'auth.login-as-test-admin',
		requestKey: 'login-once',
	})

	assert.equal(second.data.deduplicated, true)
	assert.equal(second.data.job.jobId, first.data.job.jobId)

	release()
	const job = await jobDone(client, first.data.job.jobId)
	assert.equal(job.state, 'succeeded')
	assert.equal(app.state.calls.length, 1)
})

test('serialized actions queue in order; the bounded queue reports busy', async (t) => {
	const root = makeWorkspace()
	makeConsumerApp(root, '.', { name: 'actions-app' })
	const bridge = await makeBridge(t, root)
	const order = []
	const gate = []
	const app = makeApp(bridge, {
		instanceId: 'inst_main',
		actions: [
			actionDeclaration({
				id: 'serial.work',
				input: { fields: { n: { type: 'integer' } } },
				result: {},
			}),
		],
		handle: (request) =>
			new Promise((resolve) => {
				gate.push(() =>
					resolve({
						requestId: request.requestId,
						status: 'succeeded',
						result: {},
						completedAt: new Date().toISOString(),
					}),
				)

				order.push(request.input.n)
			}),
	})

	await app.start()

	const { client } = await connect(root)
	const jobIds = []
	// 1 running + 7 queued = the 8-deep bound; the 9th must report busy.
	for (let n = 0; n < 8; n++) {
		const res = await callTool(client, 'xplat_dev_action_invoke', {
			actionId: 'serial.work',
			input: { n },
		})

		assert.equal(res.ok, true, `invoke ${n}: ${res.error?.message}`)
		jobIds.push(res.data.job.jobId)
	}

	const ninth = await callTool(client, 'xplat_dev_action_invoke', {
		actionId: 'serial.work',
		input: { n: 8 },
	})

	assert.equal(ninth.error.code, 'target_busy')
	assert.equal(ninth.error.retryable, true)

	// Drain in order — serialized means the app receives them one at a time,
	// so later gate entries appear only as earlier jobs complete.
	for (const jobId of jobIds) {
		while (!gate.length) {
			await new Promise((resolve) => setTimeout(resolve, 25))
		}

		gate.shift()()
		assert.equal((await jobDone(client, jobId)).state, 'succeeded')
	}

	assert.deepEqual(order, [0, 1, 2, 3, 4, 5, 6, 7])
})

test('cancellation is cooperative and reports separately from stopped', async (t) => {
	const root = makeWorkspace()
	makeConsumerApp(root, '.', { name: 'actions-app' })
	const bridge = await makeBridge(t, root)
	const app = makeApp(bridge, {
		instanceId: 'inst_main',
		actions: [actionDeclaration({ id: 'slow.work', execution: { cancellable: true } })],
		handle: (request, run) =>
			new Promise((resolve) => {
				const timer = setInterval(() => {
					if (run.cancelled) {
						clearInterval(timer)
						resolve({
							requestId: request.requestId,
							status: 'cancelled',
							partialEffects: ['fixture rows half-loaded'],
							completedAt: new Date().toISOString(),
						})
					}
				}, 20)
			}),
	})

	await app.start()

	const { client } = await connect(root)
	const invoked = await callTool(client, 'xplat_dev_action_invoke', { actionId: 'slow.work' })
	const jobId = invoked.data.job.jobId

	const cancelled = await callTool(client, 'xplat_job_cancel', { jobId })
	assert.equal(cancelled.data.job.state, 'cancelling')

	const job = await jobDone(client, jobId)
	assert.equal(job.state, 'cancelled')
	assert.equal(job.result.outcome.status, 'cancelled')
	assert.deepEqual(job.result.outcome.partialEffects, ['fixture rows half-loaded'])
})

test('an unresponsive action fails with a bounded timeout, outcome unknown', async (t) => {
	const root = makeWorkspace()
	makeConsumerApp(root, '.', { name: 'actions-app' })
	const bridge = await makeBridge(t, root)
	const app = makeApp(bridge, {
		instanceId: 'inst_main',
		actions: [actionDeclaration({ id: 'hang.work', execution: { timeoutMs: 300 } })],
		handle: () => new Promise(() => {}), // never settles
	})

	await app.start()

	const { client } = await connect(root)
	const invoked = await callTool(client, 'xplat_dev_action_invoke', { actionId: 'hang.work' })
	const job = await jobDone(client, invoked.data.job.jobId)
	assert.equal(job.state, 'failed')
	assert.equal(job.error.code, 'timeout')
	assert.equal(job.error.context.outcome, 'unknown')
})

test('output that violates the result contract fails without hiding that it ran', async (t) => {
	const root = makeWorkspace()
	makeConsumerApp(root, '.', { name: 'actions-app' })
	const bridge = await makeBridge(t, root)
	const app = makeApp(bridge, {
		instanceId: 'inst_main',
		actions: [actionDeclaration()],
		handle: async (request) => ({
			requestId: request.requestId,
			status: 'succeeded',
			result: { role: 42 }, // declared 'string'
			completedAt: new Date().toISOString(),
		}),
	})

	await app.start()

	const { client } = await connect(root)
	const invoked = await callTool(client, 'xplat_dev_action_invoke', {
		actionId: 'auth.login-as-test-admin',
	})

	const job = await jobDone(client, invoked.data.job.jobId)
	assert.equal(job.state, 'failed')
	assert.equal(job.error.code, 'execution_failure')
	assert.match(job.error.message, /result contract/)
})

test('an external-effects action requires the explicit grant', async (t) => {
	const root = makeWorkspace()
	makeConsumerApp(root, '.', { name: 'actions-app' })
	const bridge = await makeBridge(t, root)
	const app = makeApp(bridge, {
		instanceId: 'inst_main',
		actions: [
			actionDeclaration({
				id: 'fixtures.reset-world',
				effects: { summary: 'resets the mock test service', testData: true, externalEffects: true },
			}),
		],
		handle: async (request) => ({
			requestId: request.requestId,
			status: 'succeeded',
			result: { role: 'admin' },
			completedAt: new Date().toISOString(),
		}),
	})

	await app.start()

	const { client, context } = await connect(root)
	const denied = await callTool(client, 'xplat_dev_action_invoke', {
		actionId: 'fixtures.reset-world',
	})

	assert.equal(denied.error.code, 'permission_denied')
	assert.equal(app.state.calls.length, 0)

	context.policy.grant('external-effects', { source: 'developer' })
	const invoked = await callTool(client, 'xplat_dev_action_invoke', {
		actionId: 'fixtures.reset-world',
	})

	assert.equal(invoked.ok, true)
	const job = await jobDone(client, invoked.data.job.jobId)
	assert.equal(job.state, 'succeeded')
})

test('dev-action status ties the job to its instance and request', async (t) => {
	const root = makeWorkspace()
	makeConsumerApp(root, '.', { name: 'actions-app' })
	const bridge = await makeBridge(t, root)
	const app = makeApp(bridge, {
		instanceId: 'inst_main',
		actions: [actionDeclaration()],
		handle: async (request) => ({
			requestId: request.requestId,
			status: 'succeeded',
			result: { role: 'admin' },
			completedAt: new Date().toISOString(),
		}),
	})

	await app.start()

	const { client } = await connect(root)
	const invoked = await callTool(client, 'xplat_dev_action_invoke', {
		actionId: 'auth.login-as-test-admin',
	})

	const status = await callTool(client, 'xplat_dev_action_status', {
		jobId: invoked.data.job.jobId,
	})

	assert.equal(status.data.job.kind, 'dev-action')
	assert.equal(status.data.requestId, invoked.data.requestId)
	assert.match(status.data.instanceKey, /\/inst_main$/)

	const missing = await callTool(client, 'xplat_dev_action_status', { jobId: 'job_none' })
	assert.equal(missing.error.code, 'not_found')
})

test('scanBridgeEndpoints reads the session file the dev server wrote', async (t) => {
	const root = makeWorkspace()
	makeConsumerApp(root, '.', { name: 'actions-app' })
	const bridge = await makeBridge(t, root)

	const endpoints = scanBridgeEndpoints(root)
	assert.equal(endpoints.length, 1)
	assert.equal(endpoints[0].url, bridge.origin)
	assert.equal(endpoints[0].token, bridge.token)
})

test('a bridge announcing a canonical root still owns its registry under a symlinked workspace', async (t) => {
	const root = makeWorkspace()
	makeConsumerApp(root, '.', { name: 'actions-app' })
	// The dev server records its canonical root (vite resolves symlinks);
	// discovery keeps the given spelling — macOS /tmp and /var are links.
	const bridge = await makeBridge(t, realpathSync(root))
	const app = makeApp(bridge, {
		instanceId: 'inst_main',
		actions: [actionDeclaration()],
		handle: async () => ({}),
	})

	await app.start()

	const { client } = await connect(root)
	const live = await callTool(client, 'xplat_dev_actions')
	assert.equal(live.data.instances.length, 1)
	assert.equal(live.data.instances[0].appInstanceId, 'inst_main')
})

test('a vanished bridge marks its instances disconnected, never silently live', async (t) => {
	const root = makeWorkspace()
	makeConsumerApp(root, '.', { name: 'actions-app' })
	const bridge = await makeBridge(t, root)
	const app = makeApp(bridge, {
		instanceId: 'inst_main',
		actions: [actionDeclaration()],
		handle: async () => ({}),
	})

	await app.start()

	const { client } = await connect(root)
	const live = await callTool(client, 'xplat_dev_actions')
	assert.equal(live.data.instances.length, 1)

	// The dev server dies — the instance must not keep presenting as usable.
	app.stop()
	bridge.server.closeAllConnections?.()
	await new Promise((resolve) => bridge.server.close(resolve))

	const gone = await callTool(client, 'xplat_dev_actions')
	assert.equal(gone.data.instances.length, 0)
	assert.equal(gone.data.disconnected.length, 1)
	assert.equal(gone.data.disconnected[0].state, 'disconnected')
	assert.equal(gone.data.disconnected[0].actionCount, 1)

	const invoked = await callTool(client, 'xplat_dev_action_invoke', {
		appInstanceId: 'inst_main',
		actionId: 'auth.login-as-test-admin',
	})

	assert.equal(invoked.error.code, 'disconnected_runtime')
})
