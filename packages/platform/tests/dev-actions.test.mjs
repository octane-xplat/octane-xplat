// App-side development-action registry: declaration validation, singleton
// lifetime, and the full announce/poll/invoke loop against a real dev-bridge
// middleware — the same wire the MCP server speaks.

import assert from 'node:assert/strict'
import http from 'node:http'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'
import { xplatDevBridge } from '../../cli/src/mcp/dev-bridge.ts'

// Compile a src module to CJS and evaluate it with a sibling-file resolver,
// so dev-actions.ts loads dev-bridge.web.ts + dev-actions-schema.ts the way a
// web bundle resolves them. Native contract cases mock only Device; they do
// not establish NativeScript runtime, native fetch or OS-input acceptance.
const compile = async (file) =>
	ts.transpile(await readFile(new URL(`../src/${file}.ts`, import.meta.url), 'utf8'), {
		module: ts.ModuleKind.CommonJS,
		target: ts.ScriptTarget.ES2022,
	})

const SOURCES = {}

async function loadDevActions(globals = {}) {
	const modules = {
		'./dev-actions-schema': await compile('dev-actions-schema'),
		'./dev-bridge': await compile(globals.os ? 'dev-bridge' : 'dev-bridge.web'),
	}

	const sandbox = {
		exports: {},
		console: globals.console ?? console,
		setInterval,
		clearInterval,
		setTimeout,
		clearTimeout,
		queueMicrotask,
		AbortController,
		Promise,
		Date,
		Math,
		fetch,
		location: { origin: globals.origin },
		__XPLAT_DEV_BRIDGE__: globals.token ? { token: globals.token } : undefined,
		__NS_HTTP_ORIGIN__: globals.os ? globals.origin : undefined,
	}

	sandbox.globalThis = sandbox
	sandbox.require = (spec) => {
		if (spec === '@nativescript/core' && globals.os) {
			return { Device: { os: globals.os } }
		}

		if (spec === './dev-actions-schema' || spec === './dev-bridge') {
			const inner = { exports: {}, require: sandbox.require, console }
			inner.globalThis = sandbox
			vm.runInNewContext(modules[spec], inner)
			return inner.exports
		}

		throw new Error(`unexpected require ${spec}`)
	}

	vm.runInNewContext((SOURCES.devActions ??= await compile('dev-actions-registry')), {
		...sandbox,
		require: sandbox.require,
	})

	return { exports: sandbox.exports, sandbox }
}

async function makeBridge(t) {
	const plugin = xplatDevBridge({ appRoot: '/tmp' })
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
		config: { root: '/tmp', server: {} },
		httpServer: server,
	})

	await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
	const origin = `http://127.0.0.1:${server.address().port}`
	t.after(async () => {
		server.closeAllConnections?.()
		await new Promise((resolve) => server.close(resolve))
	})

	const call = (method, path, body) => {
		const init = { method, headers: { 'x-xplat-dev-token': token } }
		if (body) {
			init.headers['content-type'] = 'application/json'
			init.body = JSON.stringify(body)
		}

		return fetch(`${origin}/__xplat_dev__${path}`, init).then((r) => r.json())
	}

	return { origin, token, call }
}

const spec = (over = {}) => ({
	id: 'auth.login-as-test-admin',
	title: 'Log in as test admin',
	description: 'Signs in a privileged test user.',
	effects: { summary: 'changes the active test session', auth: true },
	run: async () => ({ role: 'admin' }),
	...over,
})

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const until = async (fn, timeoutMs = 5_000) => {
	const deadline = Date.now() + timeoutMs
	while (Date.now() < deadline) {
		const value = await fn()
		if (value) {
			return value
		}

		await sleep(25)
	}

	return null
}

test('declarations are validated and duplicate ids rejected, never replaced', async () => {
	const { exports: api } = await loadDevActions()

	assert.throws(() => api.registerDevAction({ id: 'x' }), /Invalid dev action/)
	assert.throws(() => api.registerDevAction(spec({ id: 'bad id!' })), /id/)

	const handle = api.registerDevAction(spec())
	assert.equal(api.devActionsRevision(), 1)
	assert.throws(() => api.registerDevAction(spec()), /already registered/)

	handle.dispose()
	assert.equal(api.devActionsRevision(), 2)
	assert.equal(api.listDevActions().length, 0)
})

test('no endpoint means the bridge stays inert instead of pretending a channel', async () => {
	const { exports: api } = await loadDevActions({ origin: undefined, token: undefined })
	const bridge = api.startDevActionBridge()
	assert.equal(bridge.state, 'unavailable')
	assert.match(bridge.lastError, /no dev-bridge endpoint/i)
})

test('the app announces its registry; mutations re-announce a new revision', async (t) => {
	const bridge = await makeBridge(t)
	const { exports: api } = await loadDevActions({ origin: bridge.origin, token: bridge.token })

	api.registerDevAction(spec())
	api.registerDevAction(
		spec({
			id: 'performance.prepare-scenario',
			title: 'Prepare performance scenario',
			description: 'Loads a fixture dataset.',
			input: { fields: { scale: { type: 'integer', default: 1000 } } },
			result: { fields: { count: { type: 'integer' }, seed: { type: 'integer' } } },
			effects: { summary: 'loads fixture data', testData: true },
			run: async (input) => ({ count: input.scale, seed: 7 }),
		}),
	)

	const handle = api.startDevActionBridge({ appLabel: 'test-app' })
	t.after(() => handle.stop())

	const seen = await until(async () => {
		const registry = await bridge.call('GET', '/registry')
		return registry.instances[0]?.revision === 2 && registry.instances[0]?.appLabel === 'test-app'
			? registry.instances[0]
			: null
	})

	assert.equal(seen.platform, 'web')
	assert.equal(seen.appLabel, 'test-app')
	assert.equal(seen.revision, 2)
	assert.deepEqual(seen.actions.map((a) => a.id).sort(), [
		'auth.login-as-test-admin',
		'performance.prepare-scenario',
	])

	// Owner disposal removes the action and bumps the announced revision.
	const extra = api.registerDevAction(spec({ id: 'temp.action', run: async () => ({}) }))
	await until(async () => (await bridge.call('GET', '/registry')).instances[0]?.revision === 3)
	extra.dispose()
	const reg = await until(async () => {
		const r = (await bridge.call('GET', '/registry')).instances[0]
		return r?.revision === 4 ? r : null
	})

	assert.equal(reg.actions.length, 2)
})

test('a declaration alone announces automatically without bridge setup', async (t) => {
	const bridge = await makeBridge(t)
	const { exports: api } = await loadDevActions({ origin: bridge.origin, token: bridge.token })

	api.registerDevAction(spec())
	t.after(() => api.startDevActionBridge().stop())
	const seen = await until(async () => (await bridge.call('GET', '/registry')).instances[0])
	assert.equal(seen.actions[0].id, 'auth.login-as-test-admin')
	assert.equal(seen.revision, 1)
})

test('native endpoint contract requires both the dev origin and token', async () => {
	for (const globals of [{ origin: 'http://127.0.0.1:1' }, { token: 'test-token' }]) {
		const { exports: api } = await loadDevActions({ os: 'iOS', ...globals })
		assert.equal(api.startDevActionBridge().state, 'unavailable')
	}
})

test('iOS action wire contract announces automatically and rechecks availability before execution', async (t) => {
	const bridge = await makeBridge(t)
	const { exports: api } = await loadDevActions({
		os: 'iOS',
		origin: bridge.origin,
		token: bridge.token,
	})

	let ready = true
	let calls = 0
	const action = api.registerDevAction(
		spec({
			availability: { platforms: ['ios'], ready: () => ready },
			result: { fields: { role: { type: 'string' } } },
			run: () => {
				calls++
				return { role: 'test-admin' }
			},
		}),
	)

	t.after(() => api.startDevActionBridge().stop())
	const instance = await until(async () => (await bridge.call('GET', '/registry')).instances[0])
	assert.ok(instance, 'native declaration must announce without manual bridge setup')
	assert.equal(instance.platform, 'ios')
	assert.equal(instance.actions[0].availability.ready, true)
	const invoke = async (requestId) => {
		await bridge.call('POST', '/invoke', {
			requestId,
			appInstanceId: instance.appInstanceId,
			actionId: instance.actions[0].id,
			registryRevision: instance.revision,
			input: {},
		})

		return until(async () => (await bridge.call('GET', `/invoke/${requestId}?wait=500`)).outcome)
	}

	ready = false
	const unavailable = await invoke('native_unavailable')
	assert.equal(unavailable.status, 'failed')
	assert.equal(unavailable.error.code, 'unavailable')
	assert.equal(calls, 0)
	ready = true
	const result = await invoke('native_ready')
	assert.equal(result.status, 'succeeded')
	assert.deepEqual(result.result, { role: 'test-admin' })
	assert.equal(calls, 1)
	action.dispose()
	const removed = await until(async () => {
		const value = (await bridge.call('GET', '/registry')).instances[0]
		return value?.revision === 2 && value.actions.length === 0 ? value : null
	})

	assert.ok(removed, 'owner disposal must remove the native action from discovery')
})

test('invocation runs the handler; invalid input and stale revisions are rejected in-app', async (t) => {
	const bridge = await makeBridge(t)
	const { exports: api } = await loadDevActions({ origin: bridge.origin, token: bridge.token })
	const calls = []

	api.registerDevAction(
		spec({
			id: 'perf.prepare',
			input: { fields: { scale: { type: 'integer', default: 100 } } },
			result: { fields: { count: { type: 'integer' } } },
			run: async (input) => {
				calls.push(input)
				return { count: input.scale }
			},
		}),
	)

	const handle = api.startDevActionBridge()
	t.after(() => handle.stop())

	const instance = await until(async () => (await bridge.call('GET', '/registry')).instances[0])

	const revision = instance.revision

	// Invalid input — the app rejects it before running the handler.
	await bridge.call('POST', '/invoke', {
		requestId: 'req_bad',
		appInstanceId: instance.appInstanceId,
		actionId: 'perf.prepare',
		registryRevision: revision,
		input: { scale: 'lots' },
	})

	const bad = await until(
		async () => (await bridge.call('GET', '/invoke/req_bad?wait=500')).outcome,
	)

	assert.equal(bad.status, 'failed')
	assert.equal(bad.error.code, 'invalid_selection')
	assert.equal(calls.length, 0)

	// Stale revision — rejected without running.
	await bridge.call('POST', '/invoke', {
		requestId: 'req_stale',
		appInstanceId: instance.appInstanceId,
		actionId: 'perf.prepare',
		registryRevision: revision + 9,
		input: {},
	})

	const stale = await until(
		async () => (await bridge.call('GET', '/invoke/req_stale?wait=500')).outcome,
	)

	assert.equal(stale.status, 'failed')
	assert.equal(stale.error.code, 'stale_identity')

	// Valid call — defaults applied, result validated.
	await bridge.call('POST', '/invoke', {
		requestId: 'req_ok',
		appInstanceId: instance.appInstanceId,
		actionId: 'perf.prepare',
		registryRevision: revision,
		input: {},
	})

	const ok = await until(async () => (await bridge.call('GET', '/invoke/req_ok?wait=500')).outcome)
	assert.equal(ok.status, 'succeeded')
	assert.deepEqual(ok.result, { count: 100 })
	assert.equal(calls.length, 1)

	// A repeated request id re-posts the outcome without re-running.
	await bridge.call('POST', '/invoke', {
		requestId: 'req_ok',
		appInstanceId: instance.appInstanceId,
		actionId: 'perf.prepare',
		registryRevision: revision,
		input: {},
	})

	await sleep(100)
	assert.equal(calls.length, 1)
})

test('serialized actions run one at a time; cancellation aborts the handler', async (t) => {
	const bridge = await makeBridge(t)
	const { exports: api } = await loadDevActions({ origin: bridge.origin, token: bridge.token })
	const order = []
	let releaseFirst
	api.registerDevAction(
		spec({
			id: 'serial.work',
			input: { fields: { n: { type: 'integer' } } },
			execution: { cancellable: true },
			run: (input, context) =>
				new Promise((resolve) => {
					order.push(input.n)
					if (input.n === 1) {
						releaseFirst = () => resolve({})
					}

					context.signal.addEventListener('abort', () => resolve({ aborted: true }))
				}),
		}),
	)

	api.registerDevAction(
		spec({
			id: 'overlap.ping',
			input: { fields: { n: { type: 'integer' } } },
			execution: { concurrency: 'overlap' },
			result: {},
			run: async (input) => {
				order.push(`ping-${input.n}`)
				return {}
			},
		}),
	)

	const handle = api.startDevActionBridge()
	t.after(() => handle.stop())

	const instance = await until(async () => (await bridge.call('GET', '/registry')).instances[0])
	const invoke = (requestId, actionId, input = {}) =>
		bridge.call('POST', '/invoke', {
			requestId,
			appInstanceId: instance.appInstanceId,
			actionId,
			registryRevision: instance.revision,
			input,
		})

	await invoke('req_1', 'serial.work', { n: 1 })
	await invoke('req_2', 'serial.work', { n: 2 })
	await invoke('req_3', 'overlap.ping', { n: 3 })

	// The overlap action finishes while the first serialized action still runs.
	const ping = await until(async () => (await bridge.call('GET', '/invoke/req_3?wait=500')).outcome)
	assert.equal(ping.status, 'succeeded')
	assert.equal((await bridge.call('GET', '/invoke/req_2')).state, 'delivered')

	// Cancel the queued serialized action, then release the first.
	await bridge.call('POST', '/invoke/cancel', { requestId: 'req_2' })
	releaseFirst()

	const first = await until(
		async () => (await bridge.call('GET', '/invoke/req_1?wait=500')).outcome,
	)

	const second = await until(
		async () => (await bridge.call('GET', '/invoke/req_2?wait=500')).outcome,
	)

	assert.equal(first.status, 'succeeded')
	assert.equal(second.status, 'cancelled')
	// The cancelled serialized action never ran its handler.
	assert.deepEqual(order, [1, 'ping-3'])
})

test('output that violates the result contract reports a failure, not a silent pass', async (t) => {
	const bridge = await makeBridge(t)
	const { exports: api } = await loadDevActions({ origin: bridge.origin, token: bridge.token })
	api.registerDevAction(
		spec({
			id: 'contract.breaks',
			result: { fields: { role: { type: 'string' } } },
			run: async () => ({ role: 42 }),
		}),
	)

	const handle = api.startDevActionBridge()
	t.after(() => handle.stop())

	const instance = await until(async () => (await bridge.call('GET', '/registry')).instances[0])
	await bridge.call('POST', '/invoke', {
		requestId: 'req_out',
		appInstanceId: instance.appInstanceId,
		actionId: 'contract.breaks',
		registryRevision: instance.revision,
		input: {},
	})

	const outcome = await until(
		async () => (await bridge.call('GET', '/invoke/req_out?wait=500')).outcome,
	)

	assert.equal(outcome.status, 'failed')
	assert.match(outcome.error.message, /result contract/)
	assert.equal(outcome.error.failures, undefined)
})

const declaration = (over = {}) => {
	const { run, ...rest } = spec(over)
	return rest
}

const stubConsole = () => {
	const warnings = []
	return {
		warnings,
		console: {
			...console,
			warn: (message) => warnings.push(String(message)),
			error: () => {},
		},
	}
}

const invokeAndAwait = async (bridge, instance, requestId, actionId, input = {}) => {
	await bridge.call('POST', '/invoke', {
		requestId,
		appInstanceId: instance.appInstanceId,
		actionId,
		registryRevision: instance.revision,
		input,
	})

	return until(async () => (await bridge.call('GET', `/invoke/${requestId}?wait=500`)).outcome)
}

test('a defined action without a handler announces unavailable; invoke is rejected', async (t) => {
	const bridge = await makeBridge(t)
	const { exports: api } = await loadDevActions({ origin: bridge.origin, token: bridge.token })
	const definition = api.defineDevAction(declaration())
	t.after(() => definition.dispose())
	t.after(() => api.startDevActionBridge().stop())

	const instance = await until(async () => (await bridge.call('GET', '/registry')).instances[0])
	const action = instance.actions.find((a) => a.id === 'auth.login-as-test-admin')
	assert.equal(action.availability.ready, false)
	assert.match(action.availability.reason, /no handler attached; its owning component is not mounted/)

	const outcome = await invokeAndAwait(bridge, instance, 'req_nohandler', action.id)
	assert.equal(outcome.status, 'failed')
	assert.equal(outcome.error.code, 'unavailable')
})

test('attaching a handler flips availability and re-announces without bumping the revision', async (t) => {
	const bridge = await makeBridge(t)
	const { exports: api } = await loadDevActions({ origin: bridge.origin, token: bridge.token })
	const definition = api.defineDevAction(declaration())
	t.after(() => definition.dispose())
	t.after(() => api.startDevActionBridge().stop())

	const instance = await until(async () => (await bridge.call('GET', '/registry')).instances[0])
	const revision = api.devActionsRevision()
	assert.equal(instance.actions[0].availability.ready, false)

	const detach = api.attachDevActionHandler(definition, async () => ({}))
	assert.equal(api.devActionsRevision(), revision)
	const ready = await until(async () => {
		const value = (await bridge.call('GET', '/registry')).instances[0]
		return value?.actions[0]?.availability.ready === true ? value : null
	})

	assert.equal(ready.revision, instance.revision)

	detach()
	detach()
	const gone = await until(async () => {
		const value = (await bridge.call('GET', '/registry')).instances[0]
		return value?.actions[0]?.availability.ready === false ? value : null
	})

	assert.equal(gone.revision, instance.revision)
	assert.equal(api.devActionsRevision(), revision)
})

test('the most recently attached handler wins; detaching it restores the previous one', async (t) => {
	const bridge = await makeBridge(t)
	const stub = stubConsole()
	const { exports: api } = await loadDevActions({
		origin: bridge.origin,
		token: bridge.token,
		console: stub.console,
	})
	const definition = api.defineDevAction(declaration({ result: { fields: { who: { type: 'string' } } } }))
	t.after(() => definition.dispose())
	t.after(() => api.startDevActionBridge().stop())

	const detachFirst = api.attachDevActionHandler(definition, async () => ({ who: 'first' }))
	const detachSecond = api.attachDevActionHandler(definition, async () => ({ who: 'second' }))
	t.after(detachFirst)

	const instance = await until(async () => (await bridge.call('GET', '/registry')).instances[0])
	const second = await invokeAndAwait(bridge, instance, 'req_newest', definition.id)
	assert.equal(second.status, 'succeeded')
	assert.deepEqual(second.result, { who: 'second' })
	assert.ok(
		stub.warnings.some((m) =>
			m.includes('Dev action "auth.login-as-test-admin" has 2 attached handlers'),
		),
	)

	detachSecond()
	const first = await invokeAndAwait(bridge, instance, 'req_restored', definition.id)
	assert.equal(first.status, 'succeeded')
	assert.deepEqual(first.result, { who: 'first' })
})

test('disposing and redefining a declaration keeps component-attached handlers working', async (t) => {
	const bridge = await makeBridge(t)
	const { exports: api } = await loadDevActions({ origin: bridge.origin, token: bridge.token })
	let definition = api.defineDevAction(
		declaration({ result: { fields: { ok: { type: 'boolean' } } } }),
	)
	t.after(() => api.startDevActionBridge().stop())

	const detach = api.attachDevActionHandler(definition, async () => ({ ok: true }))
	t.after(detach)
	definition.dispose()
	definition = api.defineDevAction(
		declaration({ result: { fields: { ok: { type: 'boolean' } } } }),
	)
	t.after(() => definition.dispose())

	const revision = api.devActionsRevision()
	const instance = await until(async () => {
		const value = (await bridge.call('GET', '/registry')).instances[0]
		return value?.revision === revision && value.actions[0]?.availability.ready === true
			? value
			: null
	})

	const outcome = await invokeAndAwait(bridge, instance, 'req_hmr', definition.id)
	assert.equal(outcome.status, 'succeeded', JSON.stringify(outcome))
})

test('detaching an owner mid-run aborts the invocation', async (t) => {
	const bridge = await makeBridge(t)
	const { exports: api } = await loadDevActions({ origin: bridge.origin, token: bridge.token })
	let started
	const startedPromise = new Promise((resolve) => (started = resolve))
	const definition = api.defineDevAction(declaration({ execution: { cancellable: true } }))
	t.after(() => definition.dispose())
	t.after(() => api.startDevActionBridge().stop())

	const detach = api.attachDevActionHandler(
		definition,
		(input, context) =>
			new Promise((resolve, reject) => {
				started()
				context.signal.addEventListener('abort', () => reject(new Error('aborted')))
			}),
	)

	const instance = await until(async () => {
		const value = (await bridge.call('GET', '/registry')).instances[0]
		return value?.actions[0]?.availability.ready === true ? value : null
	})

	await bridge.call('POST', '/invoke', {
		requestId: 'req_orphan',
		appInstanceId: instance.appInstanceId,
		actionId: definition.id,
		registryRevision: instance.revision,
		input: {},
	})

	await startedPromise
	detach()
	const outcome = await until(
		async () => (await bridge.call('GET', '/invoke/req_orphan?wait=500')).outcome,
	)

	assert.equal(outcome.status, 'cancelled')
	assert.equal(outcome.error?.failures, undefined)
})

test('registerDevAction disposes its declaration and only its own handler', async (t) => {
	const bridge = await makeBridge(t)
	const { exports: api } = await loadDevActions({ origin: bridge.origin, token: bridge.token })
	t.after(() => api.startDevActionBridge().stop())

	const handle = api.registerDevAction(spec({ run: async () => ({ who: 'module' }) }))
	assert.throws(() => api.registerDevAction(spec()), /already registered/)
	const detach = api.attachDevActionHandler('auth.login-as-test-admin', async () => ({
		who: 'component',
	}))
	t.after(detach)

	handle.dispose()
	assert.equal(api.listDevActions().length, 0)

	// The component handler survives: redefining the declaration revives it.
	const definition = api.defineDevAction(
		declaration({ result: { fields: { who: { type: 'string' } } } }),
	)
	t.after(() => definition.dispose())

	const revision = api.devActionsRevision()
	const instance = await until(async () => {
		const value = (await bridge.call('GET', '/registry')).instances[0]
		return value?.revision === revision && value.actions[0]?.availability.ready === true
			? value
			: null
	})

	const outcome = await invokeAndAwait(bridge, instance, 'req_ownhandler', definition.id)
	assert.equal(outcome.status, 'succeeded')
	assert.deepEqual(outcome.result, { who: 'component' })
})

test('retained inline declarations share owners, resolve conflicts, and yield to static declarations', async () => {
	const stub = stubConsole()
	const { exports: api } = await loadDevActions({ console: stub.console })
	const decl = declaration({ id: 'inline.thing', title: 'Inline thing' })
	const key = api.devActionDeclarationKey(decl)

	const release1 = api.retainDevAction(decl, key)
	const release2 = api.retainDevAction(decl, key)
	assert.equal(api.devActionsRevision(), 1)
	assert.equal(api.listDevActions().length, 1)

	release1()
	assert.equal(api.listDevActions().length, 1)
	release2()
	release2()
	assert.equal(api.listDevActions().length, 0)
	assert.equal(api.devActionsRevision(), 2)

	// A conflicting inline declaration replaces the spec, warns, and bumps.
	const other = declaration({ id: 'inline.thing', title: 'Other thing' })
	const release3 = api.retainDevAction(decl, key)
	const release4 = api.retainDevAction(other, api.devActionDeclarationKey(other))
	assert.ok(stub.warnings.some((m) => m.includes('conflicting inline declarations')))
	assert.equal(api.listDevActions()[0].title, 'Other thing')
	assert.equal(api.devActionsRevision(), 4)
	release3()
	release4()

	// A static declaration of the same id wins; the inline one is ignored.
	const definition = api.defineDevAction(decl)
	const release5 = api.retainDevAction(other, api.devActionDeclarationKey(other))
	assert.ok(stub.warnings.some((m) => m.includes('Inline dev action declaration')))
	assert.equal(api.listDevActions()[0].title, 'Inline thing')
	release5()
	assert.equal(api.listDevActions()[0].title, 'Inline thing')
	definition.dispose()
})

test('dev effects run every attached handler and report a handler count', async (t) => {
	const bridge = await makeBridge(t)
	const { exports: api } = await loadDevActions({ origin: bridge.origin, token: bridge.token })
	const effect = api.defineDevEffect(
		declaration({
			id: 'fixtures.reset-ui',
			title: 'Reset UI fixtures',
			input: { fields: { scope: { type: 'string', default: 'all' } } },
		}),
	)
	t.after(() => effect.dispose())
	t.after(() => api.startDevActionBridge().stop())

	// Zero attached handlers is a successful no-op broadcast.
	let instance = await until(async () => (await bridge.call('GET', '/registry')).instances[0])
	let outcome = await invokeAndAwait(bridge, instance, 'req_fx0', effect.id)
	assert.equal(outcome.status, 'succeeded')
	assert.deepEqual(outcome.result, { handlerCount: 0 })

	const calls = []
	api.attachDevEffectHandler(effect, (input) => calls.push(`a:${input.scope}`))
	api.attachDevEffectHandler(effect, (input) => calls.push(`b:${input.scope}`))
	instance = await until(async () => {
		const value = (await bridge.call('GET', '/registry')).instances[0]
		return value?.actions[0]?.availability.ready === true ? value : null
	})

	outcome = await invokeAndAwait(bridge, instance, 'req_fx2', effect.id)
	assert.equal(outcome.status, 'succeeded')
	assert.deepEqual(outcome.result, { handlerCount: 2 })
	assert.deepEqual(calls, ['a:all', 'b:all'])
})

test('a failing effect handler fails the broadcast without stopping the rest', async (t) => {
	const bridge = await makeBridge(t)
	const { exports: api } = await loadDevActions({ origin: bridge.origin, token: bridge.token })
	const effect = api.defineDevEffect(declaration({ id: 'fixtures.reset-ui' }))
	t.after(() => effect.dispose())
	t.after(() => api.startDevActionBridge().stop())

	const calls = []
	api.attachDevEffectHandler(effect, () => {
		calls.push('first')
		throw new Error('first blew up')
	})
	api.attachDevEffectHandler(effect, () => calls.push('second'))

	const instance = await until(async () => (await bridge.call('GET', '/registry')).instances[0])
	const outcome = await invokeAndAwait(bridge, instance, 'req_fxfail', effect.id)
	assert.equal(outcome.status, 'failed')
	assert.equal(outcome.error.code, 'execution_failure')
	assert.match(outcome.error.message, /1 of 2 handlers failed: first blew up/)
	assert.deepEqual(calls, ['first', 'second'])
	assert.ok(outcome.partialEffects.includes('1 of 2 handlers completed'))
})

test('failed outcomes return structured per-handler failure records with labels', async (t) => {
	const bridge = await makeBridge(t)
	const { exports: api } = await loadDevActions({ origin: bridge.origin, token: bridge.token })
	const effect = api.defineDevEffect(declaration({ id: 'fixtures.reset-ui' }))
	t.after(() => effect.dispose())
	t.after(() => api.startDevActionBridge().stop())

	api.attachDevEffectHandler(
		effect,
		() => {},
		{ label: 'A' },
	)
	api.attachDevEffectHandler(
		effect,
		() => {
			throw new TypeError('boom')
		},
		{ label: 'B' },
	)

	const instance = await until(async () => (await bridge.call('GET', '/registry')).instances[0])
	const outcome = await invokeAndAwait(bridge, instance, 'req_fxrec', effect.id)
	assert.equal(outcome.status, 'failed')
	assert.equal(outcome.error.failures.length, 1)
	const record = outcome.error.failures[0]
	assert.equal(record.handler, 1)
	assert.equal(record.label, 'B')
	assert.equal(record.name, 'TypeError')
	assert.equal(record.message, 'boom')
	assert.equal(typeof record.stack, 'string')
})

test('a single-handler action reports one failure record; thrown values normalize', async (t) => {
	const bridge = await makeBridge(t)
	const { exports: api } = await loadDevActions({ origin: bridge.origin, token: bridge.token })
	const definition = api.defineDevAction(declaration())
	t.after(() => definition.dispose())
	t.after(() => api.startDevActionBridge().stop())

	api.attachDevActionHandler(definition, () => {
		throw 'kaboom'
	})

	const instance = await until(async () => (await bridge.call('GET', '/registry')).instances[0])
	const outcome = await invokeAndAwait(bridge, instance, 'req_thrown', definition.id)
	assert.equal(outcome.status, 'failed')
	assert.equal(outcome.error.failures.length, 1)
	const record = outcome.error.failures[0]
	assert.equal(record.handler, 0)
	assert.equal(record.name, 'ThrownValue')
	assert.equal(record.message, 'kaboom')
	assert.equal(record.label, undefined)
	assert.equal(record.stack, undefined)
})

test('failure records cap at 20 and the summary counts every failure', async (t) => {
	const bridge = await makeBridge(t)
	const { exports: api } = await loadDevActions({ origin: bridge.origin, token: bridge.token })
	const effect = api.defineDevEffect(declaration({ id: 'fixtures.reset-ui' }))
	t.after(() => effect.dispose())
	t.after(() => api.startDevActionBridge().stop())

	for (let i = 0; i < 25; i++) {
		api.attachDevEffectHandler(effect, () => {
			throw new Error(`f${i}`)
		})
	}

	const instance = await until(async () => (await bridge.call('GET', '/registry')).instances[0])
	const outcome = await invokeAndAwait(bridge, instance, 'req_fxcap', effect.id)
	assert.equal(outcome.status, 'failed')
	assert.equal(outcome.error.failures.length, 20)
	assert.match(outcome.error.message, /25 of 25 handlers failed/)
	assert.match(outcome.error.message, /\(\+22 more\)/)
})

test('failure stacks are truncated to their bound', async (t) => {
	const bridge = await makeBridge(t)
	const { exports: api } = await loadDevActions({ origin: bridge.origin, token: bridge.token })
	const effect = api.defineDevEffect(declaration({ id: 'fixtures.reset-ui' }))
	t.after(() => effect.dispose())
	t.after(() => api.startDevActionBridge().stop())

	api.attachDevEffectHandler(effect, () => {
		const error = new TypeError('deep')
		error.stack = 'S'.repeat(5000)
		throw error
	})

	const instance = await until(async () => (await bridge.call('GET', '/registry')).instances[0])
	const outcome = await invokeAndAwait(bridge, instance, 'req_fxstack', effect.id)
	assert.equal(outcome.status, 'failed')
	assert.equal(outcome.error.failures[0].stack.length, 4097)
	assert.ok(outcome.error.failures[0].stack.endsWith('…'))
})
