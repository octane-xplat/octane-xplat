// Dev-bridge middleware: token auth, registry announcements, invocation
// queue/delivery/outcome, cancellation, and the session file — exercised
// against a real HTTP server wired like vite's configureServer.

import assert from 'node:assert/strict'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import http from 'node:http'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { xplatDevBridge } from '../dist/mcp/dev-bridge.js'

async function makeBridge(t, serverOverrides = {}) {
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
		...serverOverrides,
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

test('browser log batches authenticate, validate atomically, and reach process stderr', async (t) => {
	const { origin, call, plugin } = await makeBridge(t)
	assert.equal(plugin.apply, 'serve')
	assert.equal(plugin.transformIndexHtml()[0].injectTo, 'head-prepend')
	const unauthorized = await fetch(`${origin}/__xplat_dev__/logs`, { method: 'POST', body: '{}' })
	assert.equal(unauthorized.status, 401)
	const invalid = await call('POST', '/logs', {
		records: [{ level: 'error', line: 'x'.repeat(3000) }],
	})
	assert.equal(invalid.status, 400)
	const output = []
	const original = process.stderr.write
	process.stderr.write = function (chunk, ...args) {
		if (String(chunk).startsWith('[browser:')) {
			output.push(String(chunk))
			return true
		}
		return original.call(this, chunk, ...args)
	}
	try {
		const response = await call('POST', '/logs', {
			records: [{ level: 'error', line: 'failed\nstack line' }],
			dropped: 3,
		})

		assert.equal(response.status, 200)
		assert.deepEqual(await response.json(), { accepted: 1 })
	} finally {
		process.stderr.write = original
	}
	assert.ok(output.some((line) => line.includes('3 browser log records lost')))
	assert.ok(output.includes('[browser:error] failed\n'))
	assert.ok(output.includes('[browser:error] stack line\n'))
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

test('NativeScript /ns/m/ frames resolve by line text through device code', async (t) => {
	// Per-line identity map: generated line N -> source line N.
	const lines = 15
	const map = { version: 3, sources: ['index.ts'], names: [], mappings: ['AAAA', ...Array(lines - 1).fill('AACA')].join(';') }

	// Vite transform: tabs, no prelude.
	const transformed = [
		'import { a } from "./a";',
		'export function work() {',
		'\tconst earlyThrow = () => {',
		'\t\tthrow new TypeError("spike")',
		'\t}',
		'\tconst items = collectThings()',
		'\tconst more = items.map((i) => i + 1)',
		'\tfor (const i of more) {',
		'\t\tuse(i)',
		'\t\tthrow new TypeError("spike")',
		'\t}',
		'\treturn more.length',
		'}',
		'work()',
		'export const tail = true;',
	]

	// Device code: space-indented, 6-line injected prelude, 3-line injected
	// block after transformed line 5 — the shift is +6 then +9, not constant.
	const device = [
		'import __ns_core_ns_1 from "http://x/ns/core";',
		'const __nsVendor = {};',
		'import.meta.env = {};',
		'import.meta.hot = undefined;',
		'(() => { requireGuard(); })();',
		'const __nsm = "http://x";',
		...transformed.slice(0, 5).map((l) => l.replaceAll('\t', '    ')),
		'const __ns_hook_1 = () => {};',
		'}',
		'globalThis.__NS_REQUIRE_GUARD_INSTALLED__ = true;',
		...transformed.slice(5).map((l) => l.replaceAll('\t', '    ')),
	].join('\n')

	// transformed line 10 (`throw`, index 9) -> device line 19 (6 + 5 + 3 + 5)
	// transformed line 4 (`throw`, index 3) -> device line 10 (6 + 4)
	const deviceServer = http.createServer((req, res) => {
		if (req.url === '/ns/m/src/index.ts') {
			res.end(device)
			return
		}

		res.statusCode = 404
		res.end()
	})
	await new Promise((resolve) => deviceServer.listen(0, '127.0.0.1', resolve))
	t.after(async () => {
		deviceServer.closeAllConnections?.()
		await new Promise((resolve) => deviceServer.close(resolve))
	})
	const deviceOrigin = `http://127.0.0.1:${deviceServer.address().port}`

	const bridge = await makeBridge(t, {
		resolvedUrls: { local: [deviceOrigin] },
		moduleGraph: { getModuleByUrl: async () => undefined },
		transformRequest: (url) =>
			url === '/src/index.ts' || url === '/src/missing.ts'
				? { code: transformed.join('\n'), map }
				: null,
	})

	await announce(bridge.call)
	await bridge.call('POST', '/invoke', {
		requestId: 'req_ns',
		appInstanceId: 'inst_a',
		actionId: 'a.b',
		input: {},
	})

	const rawStack = [
		'TypeError: android spike effect',
		// duplicate text: greatest transformed index ≤ device line must win
		`    at work (http://x.test/ns/m/src/index.ts:19:5)`,
		// earlier copy of the same statement — text matching can't tell the
		// duplicates apart, so the greatest-≤ rule resolves it to the same
		// transformed line as `work` (documented ambiguity)
		`    at early (http://x.test/ns/m/src/index.ts:10:5)`,
		// trimmed text shorter than 8 chars — never resolved
		`    at short (http://x.test/ns/m/src/index.ts:13:3)`,
		// transformable but the device module fetch fails — stays raw
		`    at other (http://x.test/ns/m/src/missing.ts:19:5)`,
	].join('\n')

	await bridge.call('POST', '/result', {
		requestId: 'req_ns',
		outcome: {
			requestId: 'req_ns',
			status: 'failed',
			error: {
				code: 'execution_failure',
				message: 'spike',
				failures: [{ handler: 0, name: 'TypeError', message: 'spike', stack: rawStack }],
			},
			completedAt: new Date().toISOString(),
		},
	})

	const got = await bridge.call('GET', '/invoke/req_ns')
	const { outcome } = await got.json()
	const failure = outcome.error.failures[0]
	assert.equal(failure.stack, rawStack)
	assert.equal(
		failure.sourceStack,
		[
			'TypeError: android spike effect',
			// device indent 4 -> transformed indent 1, so :5 stays col offset 0 → map col 1
			'    at work (src/index.ts:10:1)',
			'    at early (src/index.ts:10:1)',
			'    at short (http://x.test/ns/m/src/index.ts:13:3)',
			'    at other (http://x.test/ns/m/src/missing.ts:19:5)',
		].join('\n'),
	)
})

test('NativeScript /ns/m/ paths for workspace packages anchor at the workspace root', async (t) => {
	// @nativescript/vite serves files outside the app root as
	// /ns/m/<workspace-relative path>; vite only transforms them as /@fs/<abs>.
	const workspace = mkdtempSync(join(tmpdir(), 'xplat-bridge-ws-'))
	t.after(() => rmSync(workspace, { recursive: true, force: true }))
	const root = join(workspace, 'apps', 'app')
	const libFile = join(workspace, 'packages', 'lib', 'src', 'x.ts')
	mkdirSync(root, { recursive: true })
	mkdirSync(dirname(libFile), { recursive: true })
	writeFileSync(libFile, '')

	const transformed = ['export function work() {', '\tthrow new TypeError("lib")', '}'].join('\n')
	const device = ['const __nsPrelude = 1;', transformed.replaceAll('\t', '  ')].join('\n')
	const map = { version: 3, sources: ['x.ts'], names: [], mappings: 'AAAA;AACA;AACA' }

	const deviceServer = http.createServer((req, res) => {
		res.statusCode = req.url === '/ns/m/packages/lib/src/x.ts' ? 200 : 404
		res.end(res.statusCode === 200 ? device : '')
	})
	await new Promise((resolve) => deviceServer.listen(0, '127.0.0.1', resolve))
	t.after(async () => {
		deviceServer.closeAllConnections?.()
		await new Promise((resolve) => deviceServer.close(resolve))
	})

	const fsUrl = `/@fs${libFile}`
	const bridge = await makeBridge(t, {
		config: { root, server: {} },
		resolvedUrls: { local: [`http://127.0.0.1:${deviceServer.address().port}`] },
		moduleGraph: { getModuleByUrl: async (url) => (url === fsUrl ? { file: libFile } : undefined) },
		transformRequest: (url) => (url === fsUrl ? { code: transformed, map } : null),
	})

	await announce(bridge.call)
	await bridge.call('POST', '/invoke', { requestId: 'req_ws', appInstanceId: 'inst_a', actionId: 'a.b', input: {} })
	const rawStack = 'TypeError: lib\n    at work (http://x.test/ns/m/packages/lib/src/x.ts:3:3)'
	await bridge.call('POST', '/result', {
		requestId: 'req_ws',
		outcome: {
			requestId: 'req_ws',
			status: 'failed',
			error: {
				code: 'execution_failure',
				message: 'lib',
				failures: [{ handler: 0, name: 'TypeError', message: 'lib', stack: rawStack }],
			},
			completedAt: new Date().toISOString(),
		},
	})

	const { outcome } = await (await bridge.call('GET', '/invoke/req_ws')).json()
	assert.equal(
		outcome.error.failures[0].sourceStack,
		'TypeError: lib\n    at work (../../packages/lib/src/x.ts:2:1)',
	)
})

test('failure stacks resolve http frames to root-relative source positions', async (t) => {
	// Minimal real map: generated line1/line2 -> same source line/col0.
	const map = (source) => ({ version: 3, sources: [source], names: [], mappings: 'AAAA;AACA' })
	const ids = { moduleId: '', appModuleId: '' }
	const bridge = await makeBridge(t, {
		moduleGraph: {
			getModuleByUrl: async (url) =>
				url === '/@fs/served/mod.ts?import'
					? { file: ids.moduleId }
					: url === '/src/App.tsx?t=1'
						? { file: ids.appModuleId }
						: undefined,
		},
		transformRequest: (url) => {
			if (url === '/@fs/served/mod.ts?import') {
				return { code: 'x', map: map('mod.ts') }
			}

			if (url === '/src/App.tsx?t=1') {
				return { code: 'x', map: map('App.tsx') }
			}

			if (url === '/src/Other.tsx') {
				return { code: 'x', map: map('Other.tsx') }
			}

			if (url === '/boom.ts') {
				throw new Error('transform failed')
			}

			return null
		},
	})
	ids.moduleId = join(bridge.appRoot, 'src', 'mod.ts')
	ids.appModuleId = join(bridge.appRoot, 'src', 'App.tsx')

	await announce(bridge.call)
	await bridge.call('POST', '/invoke', {
		requestId: 'req_stack',
		appInstanceId: 'inst_a',
		actionId: 'a.b',
		input: {},
	})

	const rawStack = [
		'TypeError: boom',
		'    at thrower (http://127.0.0.1:1234/@fs/served/mod.ts?import:1:1)',
		'    at Module.work@http://127.0.0.1:1234/@fs/served/mod.ts?import:2:5',
		'    at App (http://127.0.0.1:1234/src/App.tsx?t=1:2:3)',
		'    at Other (http://127.0.0.1:1234/src/Other.tsx:1:7)',
		'    at eval (file:///app/bundle.mjs:1:1)',
		'    at run (http://127.0.0.1:1234/unknown.ts:9:9)',
		'    at boom (http://127.0.0.1:1234/boom.ts:4:4)',
	].join('\n')

	const post = await bridge.call('POST', '/result', {
		requestId: 'req_stack',
		outcome: {
			requestId: 'req_stack',
			status: 'failed',
			error: {
				code: 'execution_failure',
				message: 'boom',
				failures: [{ handler: 0, name: 'TypeError', message: 'boom', stack: rawStack }],
			},
			completedAt: new Date().toISOString(),
		},
	})
	assert.equal(post.status, 200)

	const got = await bridge.call('GET', '/invoke/req_stack')
	const { outcome } = await got.json()
	const failure = outcome.error.failures[0]
	assert.equal(failure.stack, rawStack)
	assert.equal(
		failure.sourceStack,
		[
			'TypeError: boom',
			'    at thrower (src/mod.ts:1:1)',
			'    at Module.work@src/mod.ts:2:1',
			// in-root module via moduleGraph file
			'    at App (src/App.tsx:2:1)',
			// in-root module with no moduleGraph entry — root + pathname fallback
			'    at Other (src/Other.tsx:1:1)',
			'    at eval (file:///app/bundle.mjs:1:1)',
			'    at run (http://127.0.0.1:1234/unknown.ts:9:9)',
			'    at boom (http://127.0.0.1:1234/boom.ts:4:4)',
		].join('\n'),
	)
})

test('a failure with no resolvable frames keeps no sourceStack; a transform throw still stores', async (t) => {
	const bridge = await makeBridge(t, {
		moduleGraph: { getModuleByUrl: () => undefined },
		transformRequest: () => {
			throw new Error('no transforms here')
		},
	})

	await announce(bridge.call)
	await bridge.call('POST', '/invoke', {
		requestId: 'req_nostk',
		appInstanceId: 'inst_a',
		actionId: 'a.b',
		input: {},
	})

	const rawStack = 'TypeError: boom\n    at eval (file:///app/bundle.mjs:1:1)'
	const post = await bridge.call('POST', '/result', {
		requestId: 'req_nostk',
		outcome: {
			requestId: 'req_nostk',
			status: 'failed',
			error: {
				code: 'execution_failure',
				message: 'boom',
				failures: [{ handler: 0, name: 'TypeError', message: 'boom', stack: rawStack }],
			},
			completedAt: new Date().toISOString(),
		},
	})
	assert.equal(post.status, 200)

	const { outcome } = await (await bridge.call('GET', '/invoke/req_nostk')).json()
	assert.equal(outcome.error.failures[0].stack, rawStack)
	assert.equal(outcome.error.failures[0].sourceStack, undefined)
})
