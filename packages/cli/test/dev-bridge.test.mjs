// Dev-bridge middleware: token auth, registry announcements, invocation
// queue/delivery/outcome, cancellation, and the session file — exercised
// against a real HTTP server wired like vite's configureServer.

import assert from 'node:assert/strict'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import http from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { xplatDevBridge } from '../src/mcp/dev-bridge.mjs'

async function makeBridge(t) {
	const appRoot = mkdtempSync(join(tmpdir(), 'xplat-bridge-app-'))
	t.after(() => rmSync(appRoot, { recursive: true, force: true }))

	const plugin = xplatDevBridge({ appRoot })
	const token = JSON.parse(plugin.config().define.__XPLAT_DEV_BRIDGE__).token

	let middleware
	const server = http.createServer((req, res) =>
		middleware(req, res, () => {
			res.statusCode = 404
			res.end('not a bridge route')
		}),
	)

	plugin.configureServer({
		middlewares: { use: (fn) => (middleware = fn) },
		config: { root: appRoot, server: {} },
		httpServer: server,
	})

	await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
	t.after(async () => {
		server.closeAllConnections?.()
		await new Promise((resolve) => server.close(resolve))
	})

	const origin = `http://127.0.0.1:${server.address().port}`
	const call = (method, path, body, headers = {}) => {
		const init = { method, headers: { 'x-xplat-dev-token': token, ...headers } }
		if (body) {
			init.headers['content-type'] = 'application/json'
			init.body = JSON.stringify(body)
		}

		return fetch(`${origin}/__xplat_dev__${path}`, init)
	}

	return { origin, token, appRoot, server, call, plugin }
}

const announce = (call, over = {}) =>
	call('POST', '/registry', {
		protocol: 'xplat-dev-actions',
		version: 1,
		appInstanceId: 'inst_a',
		platform: 'web',
		revision: 1,
		announcedAt: new Date().toISOString(),
		actions: [],
		...over,
	})

test('every route requires the dev-bridge token', async (t) => {
	const { origin } = await makeBridge(t)

	for (const path of ['/registry', '/poll?instance=x', '/invoke/req_1']) {
		const res = await fetch(`${origin}/__xplat_dev__${path}`)
		assert.equal(res.status, 401)
	}

	const wrong = await fetch(`${origin}/__xplat_dev__/registry`, {
		headers: { 'x-xplat-dev-token': 'nope' },
	})

	assert.equal(wrong.status, 401)
})

test('the session file lands under the app root with url, token and pid', async (t) => {
	const { appRoot, token, origin } = await makeBridge(t)

	// writeSessionFile fires on httpServer 'listening' — already listened.
	const dir = join(appRoot, 'node_modules/.cache/xplat/dev-bridge')
	const { readdirSync } = await import('node:fs')
	const files = readdirSync(dir)
	assert.equal(files.length, 1)

	const session = JSON.parse(readFileSync(join(dir, files[0]), 'utf8'))
	assert.equal(session.url, origin)
	assert.equal(session.token, token)
	assert.equal(session.pid, process.pid)
	assert.ok(existsSync(join(dir, files[0])))
})

test('announcements flow into the agent-facing registry; malformed ones are rejected', async (t) => {
	const { call } = await makeBridge(t)

	const bad = await call('POST', '/registry', { hello: 'world' })
	assert.equal(bad.status, 400)

	assert.equal((await announce(call)).status, 200)
	assert.equal(
		(await announce(call, { appInstanceId: 'inst_b', actions: [{ id: 'a.b' }] })).status,
		200,
	)

	const registry = await (await call('GET', '/registry')).json()
	const ids = registry.instances.map((i) => i.appInstanceId).sort()
	assert.deepEqual(ids, ['inst_a', 'inst_b'])
	assert.equal(registry.instances[1].actions.length, 1)
})

test('invoke → poll → result → outcome, with request-id dedupe', async (t) => {
	const { call } = await makeBridge(t)
	await announce(call)

	const invoke = {
		requestId: 'req_1',
		appInstanceId: 'inst_a',
		actionId: 'auth.login',
		registryRevision: 1,
		input: { role: 'admin' },
	}

	const accepted = await (await call('POST', '/invoke', invoke)).json()
	assert.equal(accepted.accepted, true)

	// Repeating the same request id never queues twice.
	const dupe = await (await call('POST', '/invoke', invoke)).json()
	assert.equal(dupe.deduplicated, true)

	// The app polls and receives the pending work once.
	const work = await (await call('GET', '/poll?instance=inst_a')).json()
	assert.equal(work.invocations.length, 1)
	assert.equal(work.invocations[0].actionId, 'auth.login')
	assert.deepEqual(work.invocations[0].input, { role: 'admin' })

	const again = await (await call('GET', '/poll?instance=inst_a')).json()
	assert.equal(again.invocations.length, 0)

	// The agent's outcome wait resolves when the app posts a result.
	const outcomeWait = call('GET', '/invoke/req_1?wait=5000').then((r) => r.json())
	const posted = await call('POST', '/result', {
		requestId: 'req_1',
		outcome: {
			requestId: 'req_1',
			status: 'succeeded',
			result: { role: 'admin' },
			completedAt: new Date().toISOString(),
		},
	})

	assert.equal(posted.status, 200)

	const outcome = await outcomeWait
	assert.equal(outcome.state, 'completed')
	assert.equal(outcome.outcome.result.role, 'admin')

	// Unknown targets and unknown requests are honest failures.
	assert.equal(
		(await call('POST', '/invoke', { ...invoke, requestId: 'req_2', appInstanceId: 'ghost' }))
			.status,
		404,
	)

	assert.equal((await call('GET', '/invoke/req_missing')).status, 404)
})

test('cancel flags reach the app through the poll response', async (t) => {
	const { call } = await makeBridge(t)
	await announce(call)
	await call('POST', '/invoke', {
		requestId: 'req_c',
		appInstanceId: 'inst_a',
		actionId: 'perf.run',
		registryRevision: 1,
		input: {},
	})

	// Delivered, then cancelled before the app finishes.
	await call('GET', '/poll?instance=inst_a')
	assert.equal((await call('POST', '/invoke/cancel', { requestId: 'req_c' })).status, 200)

	const poll = await (await call('GET', '/poll?instance=inst_a')).json()
	assert.deepEqual(poll.cancel, ['req_c'])
})

test('the app-side long poll wakes as soon as work is queued', async (t) => {
	const { call } = await makeBridge(t)
	await announce(call)

	const started = Date.now()
	const pending = call('GET', '/poll?instance=inst_a&wait=10000').then((r) => r.json())
	await new Promise((resolve) => setTimeout(resolve, 50))
	await call('POST', '/invoke', {
		requestId: 'req_w',
		appInstanceId: 'inst_a',
		actionId: 'x.y',
		registryRevision: 1,
		input: {},
	})

	const work = await pending
	assert.ok(Date.now() - started < 5_000)
	assert.equal(work.invocations[0].requestId, 'req_w')
})
