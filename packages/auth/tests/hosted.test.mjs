import assert from 'node:assert/strict'
import { createHash, randomBytes } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

const compile = async (file) =>
	ts.transpile(await readFile(new URL(`../src/${file}.ts`, import.meta.url), 'utf8'), {
		module: ts.ModuleKind.CommonJS,
		target: ts.ScriptTarget.ES2022,
	})

const hosted = await compile('hosted')
const base64Module = {}
vm.runInNewContext(await compile('base64'), { exports: base64Module })
const sha256Module = {}
vm.runInNewContext(await compile('sha256'), { exports: sha256Module })

const ORIGIN = 'https://api.test'

function loadHosted({ platform = {} } = {}) {
	const exports = {}
	vm.runInNewContext(hosted, {
		exports,
		require: (id) => {
			switch (id) {
				case './base64':
					return base64Module
				case './sha256':
					return sha256Module
				case '@octane-xplat/platform':
					return {
						authSession: { supported: false, impl: null, ...platform.authSession },
						random: {
							supported: true,
							bytes: (n) => new Uint8Array(randomBytes(n)),
							...platform.random,
						},
					}
				case '@octane-xplat/secure-storage':
					return { secureStorage: { impl: null, ...platform.secureStorage } }
				default:
					return {}
			}
		},
	})

	return exports
}

const response = (status, body = {}, headers = {}) => ({
	ok: status >= 200 && status < 300,
	status,
	headers: { get: (name) => headers[name.toLowerCase()] ?? null },
	json: async () => body,
	text: async () => JSON.stringify(body),
})

function fakeFetch(handler) {
	const requests = []
	const fetch = async (url, init) => {
		requests.push({ url, init })
		return handler(url, init)
	}

	return { fetch, requests }
}

const memoryStore = () => {
	const map = new Map()
	return {
		map,
		get: async (key) => map.get(key) ?? null,
		set: async (key, value) => void map.set(key, value),
		remove: async (key) => void map.delete(key),
	}
}

const sessionReturning = (result) => {
	const opened = []
	return {
		opened,
		session: {
			supported: true,
			open: async (url) => {
				opened.push(url)
				return typeof result === 'function' ? result(url) : result
			},
		},
	}
}

// A deliberately non-Coreframe backend contract — different endpoints, param
// names, and field names prove the client carries no product wire shape.
function ticketFlow({ origin = ORIGIN, overrides = {} } = {}) {
	const readTicket = (url) =>
		url
			.split('?')[1]
			?.split('&')
			.find((p) => p.startsWith('ticket='))
			?.slice('ticket='.length) ?? null

	return {
		begin: async ({ fetch: transport, pkce }) => {
			const res = await transport(`${origin}/oauth2/attempt`, {
				body: JSON.stringify({ challenge: pkce.challenge, scheme: 'testapp' }),
				method: 'POST',
			})

			const body = await res.json()
			if (!res.ok) {
				throw new Error(`ticketFlow: attempt rejected (${res.status})`)
			}

			return {
				url: `${origin}/authorize?attempt_id=${body.attempt_id}&state=${body.state}`,
				callbackScheme: 'testapp',
				state: body.state,
				data: { attemptId: body.attempt_id },
			}
		},
		complete: async (callbackUrl, attempt, { fetch: transport, pkce }) => {
			const ticket = readTicket(callbackUrl)
			if (!ticket) {
				return null
			}

			const res = await transport(`${origin}/oauth2/grant`, {
				body: JSON.stringify({ state: attempt.state, ticket, verifier: pkce.verifier }),
				method: 'POST',
			})

			const body = await res.json()
			if (!res.ok) {
				throw new Error(`ticketFlow: grant rejected (${res.status})`)
			}

			return {
				expiresAt: body.valid_until,
				sessionToken: body.session,
				token: body.access_token,
			}
		},
		refresh: async (creds, { fetch: transport }) => {
			const res = await transport(`${origin}/oauth2/access`, {
				headers: { authorization: `Bearer ${creds.sessionToken}` },
				method: 'POST',
			})

			if (res.status === 401) {
				return null
			}

			const body = await res.json()
			return {
				expiresAt: body.valid_until,
				sessionToken: creds.sessionToken,
				token: body.access_token,
			}
		},
		revoke: async (creds, { fetch: transport }) => {
			await transport(`${origin}/oauth2/revoke`, {
				headers: { authorization: `Bearer ${creds.sessionToken}` },
				method: 'POST',
			})
		},
		...overrides,
	}
}

const attemptThenGrant = ({ exchangeStatus = 200, exchangeBody } = {}) => {
	const session = sessionReturning((url) => {
		const state = new URL(url).searchParams.get('state')
		return { type: 'success', url: `testapp://cb?ticket=t.${'x'.repeat(32)}&state=${state}` }
	})

	const { fetch, requests } = fakeFetch((url) => {
		if (url.endsWith('/oauth2/attempt')) {
			return response(200, { attempt_id: 'a'.repeat(43), state: 's'.repeat(43) })
		}

		if (url.endsWith('/oauth2/grant')) {
			return response(
				exchangeStatus,
				exchangeBody ?? {
					access_token: 'access-token',
					session: 'session-token',
					valid_until: Date.now() + 3_600_000,
				},
			)
		}

		return response(200, {})
	})

	return { fetch, opened: session.opened, requests, session: session.session }
}

const storedCreds = (overrides = {}) =>
	JSON.stringify({
		expiresAt: Date.now() + 3_600_000,
		sessionToken: 'session-token',
		token: 'access-token',
		...overrides,
	})

test('rejects a non-origin apiOrigin', () => {
	const { createHostedAuth } = loadHosted()
	assert.throws(() => createHostedAuth({ apiOrigin: 'https://api.test/path', flow: {} }), /origin/)
})

test('runs begin → ceremony → complete and stores credentials', async () => {
	const { createHostedAuth } = loadHosted()
	const storage = memoryStore()
	const { fetch, opened, requests, session } = attemptThenGrant()
	const beginCalls = []
	const flow = ticketFlow()
	const wrapped = {
		...flow,
		begin: (ctx) => {
			beginCalls.push(ctx)
			return flow.begin(ctx)
		},
	}

	const auth = createHostedAuth({
		apiOrigin: ORIGIN,
		authSession: session,
		fetch,
		flow: wrapped,
		storage,
	})

	assert.equal((await auth.signIn()).status, 'success')

	// The client supplies a real PKCE pair: challenge = base64url(sha256(verifier)).
	const { pkce } = beginCalls[0]
	assert.match(pkce.verifier, /^[A-Za-z0-9_-]{43}$/)
	const expectedChallenge = createHash('sha256').update(pkce.verifier).digest()
	assert.equal(pkce.challenge, Buffer.from(expectedChallenge).toString('base64url'))

	const attemptBody = JSON.parse(String(requests[0].init?.body))
	assert.equal(attemptBody.scheme, 'testapp')
	assert.equal(attemptBody.challenge, pkce.challenge)
	assert.deepEqual(opened, [
		`${ORIGIN}/authorize?attempt_id=${'a'.repeat(43)}&state=${'s'.repeat(43)}`,
	])

	const grantBody = JSON.parse(String(requests[1].init?.body))
	assert.equal(grantBody.ticket, `t.${'x'.repeat(32)}`)
	assert.equal(grantBody.verifier, pkce.verifier)
	assert.equal(grantBody.state, 's'.repeat(43))

	const stored = JSON.parse(storage.map.get('hosted-auth'))
	assert.equal(stored.sessionToken, 'session-token')
	assert.equal(stored.token, 'access-token')
	assert.equal(typeof stored.expiresAt, 'number')
	assert.equal(await auth.getAccessToken(), 'access-token')
	assert.equal(await auth.restore(), 'authenticated')
})

test('maps a dismissed ceremony to cancelled', async () => {
	const { createHostedAuth } = loadHosted()
	const { session } = sessionReturning({ type: 'cancel' })
	const { fetch } = fakeFetch(() =>
		response(200, { attempt_id: 'a'.repeat(43), state: 's'.repeat(43) }),
	)

	const auth = createHostedAuth({
		apiOrigin: ORIGIN,
		authSession: session,
		fetch,
		flow: ticketFlow(),
	})

	assert.equal((await auth.signIn()).status, 'cancelled')
})

test('rejects a callback whose state does not match the attempt', async () => {
	const { createHostedAuth } = loadHosted()
	const session = sessionReturning({
		type: 'success',
		url: `testapp://cb?ticket=t.${'x'.repeat(32)}&state=${'x'.repeat(43)}`,
	})

	const { fetch, requests } = fakeFetch(() =>
		response(200, { attempt_id: 'a'.repeat(43), state: 's'.repeat(43) }),
	)

	const auth = createHostedAuth({
		apiOrigin: ORIGIN,
		authSession: session,
		fetch,
		flow: ticketFlow(),
	})

	assert.equal((await auth.signIn()).status, 'error')
	assert.ok(!requests.some((r) => r.url.endsWith('/oauth2/grant')))
})

test('fetch attaches Bearer only to same-origin authorized paths', async () => {
	const { createHostedAuth } = loadHosted()
	const storage = memoryStore()
	storage.map.set('hosted-auth', storedCreds())
	const { fetch, requests } = fakeFetch(() => response(200, {}))
	const auth = createHostedAuth({
		apiOrigin: ORIGIN,
		fetch,
		flow: ticketFlow(),
		storage,
	})

	await auth.restore()
	await auth.fetch('/api/me')
	await auth.fetch(`${ORIGIN}/api/me`)
	await auth.fetch('/api/auth/session')
	await auth.fetch('https://other.test/api/me')
	await auth.fetch('/other/path')

	const bearer = (r) => r.init?.headers?.authorization
	assert.equal(requests[0].url, `${ORIGIN}/api/me`)
	assert.equal(bearer(requests[0]), 'Bearer access-token')
	assert.equal(bearer(requests[1]), 'Bearer access-token')
	assert.equal(bearer(requests[2]), undefined)
	assert.equal(bearer(requests[3]), undefined)
	assert.equal(bearer(requests[4]), undefined)
})

test('custom authorizePath overrides the default carve-out', async () => {
	const { createHostedAuth } = loadHosted()
	const storage = memoryStore()
	storage.map.set('hosted-auth', storedCreds())
	const { fetch, requests } = fakeFetch(() => response(200, {}))
	const auth = createHostedAuth({
		apiOrigin: ORIGIN,
		authorizePath: (p) => p.startsWith('/v1/'),
		fetch,
		flow: ticketFlow(),
		storage,
	})

	await auth.restore()
	await auth.fetch('/v1/me')
	await auth.fetch('/api/me')
	assert.equal(requests[0].init?.headers?.authorization, 'Bearer access-token')
	assert.equal(requests[1].init?.headers?.authorization, undefined)
})

test('replays once with a fresh token on an invalid_token challenge', async () => {
	const { createHostedAuth } = loadHosted()
	const storage = memoryStore()
	storage.map.set('hosted-auth', storedCreds({ token: 'stale-token' }))

	let apiCalls = 0
	const { fetch, requests } = fakeFetch((url, init) => {
		if (url.endsWith('/oauth2/access')) {
			assert.equal(init?.headers?.authorization, 'Bearer session-token')
			return response(200, { access_token: 'fresh-token', valid_until: Date.now() + 3_600_000 })
		}

		apiCalls++
		return apiCalls === 1
			? response(401, {}, { 'www-authenticate': 'Bearer error="invalid_token"' })
			: response(200, {})
	})

	const auth = createHostedAuth({
		apiOrigin: ORIGIN,
		fetch,
		flow: ticketFlow(),
		storage,
	})

	await auth.restore()

	const res = await auth.fetch('/api/me')
	assert.equal(res.status, 200)
	assert.equal(apiCalls, 2)
	assert.equal(requests[2].init?.headers?.authorization, 'Bearer fresh-token')
})

test('clears credentials when the flow refresh reports a dead session', async () => {
	const { createHostedAuth } = loadHosted()
	const storage = memoryStore()
	storage.map.set('hosted-auth', storedCreds({ expiresAt: Date.now() - 1000, token: 'dead-token' }))
	const { fetch } = fakeFetch(() => response(401, {}))
	const auth = createHostedAuth({
		apiOrigin: ORIGIN,
		fetch,
		flow: ticketFlow(),
		storage,
	})

	await auth.restore()

	assert.equal(await auth.getAccessToken(), null)
	assert.equal(storage.map.has('hosted-auth'), false)
	assert.equal(await auth.restore(), 'unauthenticated')
})

test('signOut revokes the session credential and clears storage', async () => {
	const { createHostedAuth } = loadHosted()
	const storage = memoryStore()
	storage.map.set('hosted-auth', storedCreds())
	const { fetch, requests } = fakeFetch(() => response(200, {}))
	const auth = createHostedAuth({
		apiOrigin: ORIGIN,
		fetch,
		flow: ticketFlow(),
		storage,
	})

	await auth.restore()

	await auth.signOut()
	assert.equal(requests.length, 1)
	assert.equal(requests[0].url, `${ORIGIN}/oauth2/revoke`)
	assert.equal(requests[0].init?.method, 'POST')
	assert.equal(requests[0].init?.headers?.authorization, 'Bearer session-token')
	assert.equal(storage.map.has('hosted-auth'), false)
	assert.equal(await auth.getAccessToken(), null)
})

test('a flow without refresh/revoke still signs in and clears on sign-out', async () => {
	const { createHostedAuth } = loadHosted()
	const storage = memoryStore()
	const { fetch, session } = attemptThenGrant()
	const flow = ticketFlow({ fetch, overrides: { refresh: undefined, revoke: undefined } })
	const auth = createHostedAuth({
		apiOrigin: ORIGIN,
		authSession: session,
		fetch,
		flow,
		storage,
	})

	assert.equal((await auth.signIn()).status, 'success')
	// With no refresh path, an expired access token resolves null.
	storage.map.set('hosted-auth', storedCreds({ expiresAt: Date.now() - 1000 }))
	const stale = createHostedAuth({
		apiOrigin: ORIGIN,
		fetch,
		flow,
		storage,
	})

	await stale.restore()
	assert.equal(await stale.getAccessToken(), null)
	await auth.signOut()
	assert.equal(storage.map.has('hosted-auth'), false)
})

test('supported reports the platform ceremony and CSPRNG capabilities', async () => {
	const unsupported = loadHosted({ platform: { authSession: { supported: false } } })
	const supportedPlatform = loadHosted({ platform: { authSession: { supported: true } } })
	const noRandom = loadHosted({
		platform: { authSession: { supported: true }, random: { supported: false } },
	})

	const { createHostedAuth } = unsupported
	const flow = ticketFlow()
	assert.equal(createHostedAuth({ apiOrigin: ORIGIN, flow }).supported, false)
	assert.equal(supportedPlatform.createHostedAuth({ apiOrigin: ORIGIN, flow }).supported, true)
	assert.equal(noRandom.createHostedAuth({ apiOrigin: ORIGIN, flow }).supported, false)
})

test('apiOrigin requires HTTPS, allows loopback HTTP for development', () => {
	const { createHostedAuth } = loadHosted()
	const flow = ticketFlow()
	for (const bad of [
		'http://api.test',
		'https://user:pass@api.test',
		'http://user@localhost',
		'ftp://api.test',
	]) {
		assert.throws(() => createHostedAuth({ apiOrigin: bad, flow }), /HTTPS origin/)
	}

	for (const good of [
		'https://api.test',
		'https://api.test:8443',
		'http://localhost:3000',
		'http://127.0.0.1:8080',
		'http://[::1]',
	]) {
		assert.doesNotThrow(() => createHostedAuth({ apiOrigin: good, flow }))
	}
})

test('a second concurrent signIn resolves an already-active error', async () => {
	const { createHostedAuth } = loadHosted()
	const { session } = sessionReturning(() => new Promise(() => {}))
	const { fetch } = fakeFetch(() =>
		response(200, { attempt_id: 'a'.repeat(43), state: 's'.repeat(43) }),
	)

	const auth = createHostedAuth({
		apiOrigin: ORIGIN,
		authSession: session,
		fetch,
		flow: ticketFlow(),
	})

	void auth.signIn() // first ceremony stays parked on the open browser session
	const second = await auth.signIn()
	assert.equal(second.status, 'error')
	assert.match(second.message, /already active/)
})

test('a malformed percent-encoded callback resolves an error result', async () => {
	const { createHostedAuth } = loadHosted()
	const { session } = sessionReturning({
		type: 'success',
		url: `testapp://cb?ticket=t.${'x'.repeat(32)}&state=%`,
	})

	const { fetch, requests } = fakeFetch(() =>
		response(200, { attempt_id: 'a'.repeat(43), state: 's'.repeat(43) }),
	)

	const auth = createHostedAuth({
		apiOrigin: ORIGIN,
		authSession: session,
		fetch,
		flow: ticketFlow(),
	})

	const result = await auth.signIn()
	assert.equal(result.status, 'error')
	assert.match(result.message ?? '', /state/)
	assert.ok(!requests.some((r) => r.url.endsWith('/oauth2/grant')))
})

test('a signOut landing mid-refresh is not resurrected by the refresh result', async () => {
	const { createHostedAuth } = loadHosted()
	const storage = memoryStore()
	storage.map.set(
		'hosted-auth',
		storedCreds({ expiresAt: Date.now() - 1000, sessionToken: 'old-session', token: 'stale' }),
	)

	let releaseRefresh
	const entered = deferred()
	const flow = ticketFlow({
		overrides: { refresh: () => new Promise((resolve) => { releaseRefresh = resolve; entered.resolve() }) },
	})

	const { fetch } = fakeFetch(() => response(200, {}))
	const auth = createHostedAuth({ apiOrigin: ORIGIN, fetch, flow, storage })

	await auth.restore()
	const token = auth.getAccessToken() // starts the in-flight refresh
	await entered.promise
	await auth.signOut() // clears the slot while the refresh is pending
	releaseRefresh({
		expiresAt: Date.now() + 3_600_000,
		sessionToken: 'new-session',
		token: 'fresh',
	})

	assert.equal(await token, null)
	assert.equal(storage.map.has('hosted-auth'), false)
	assert.equal(await auth.getAccessToken(), null)
})

test('a fresh signIn landing mid-refresh survives a dead-session refresh result', async () => {
	const { createHostedAuth } = loadHosted()
	const storage = memoryStore()
	storage.map.set(
		'hosted-auth',
		storedCreds({ expiresAt: Date.now() - 1000, sessionToken: 'old-session' }),
	)

	let releaseRefresh
	const entered = deferred()
	const flow = ticketFlow({
		overrides: { refresh: () => new Promise((resolve) => { releaseRefresh = resolve; entered.resolve() }) },
	})

	const { fetch, session } = attemptThenGrant()
	const auth = createHostedAuth({ apiOrigin: ORIGIN, authSession: session, fetch, flow, storage })

	await auth.restore()
	const token = auth.getAccessToken() // pending refresh on the old session
	await entered.promise
	assert.equal((await auth.signIn()).status, 'success')
	releaseRefresh(null) // the old session reports dead

	assert.equal(await token, null)
	const stored = JSON.parse(storage.map.get('hosted-auth'))
	assert.equal(stored.sessionToken, 'session-token') // the new signIn's credential survives
	assert.equal(await auth.getAccessToken(), 'access-token')
})

test('a non-replayable body surfaces the original challenge instead of a replay throw', async () => {
	const { createHostedAuth } = loadHosted()
	const storage = memoryStore()
	storage.map.set('hosted-auth', storedCreds({ token: 'stale-token' }))

	const body = { used: false }
	let apiCalls = 0
	const { fetch, requests } = fakeFetch((url, init) => {
		if (url.endsWith('/oauth2/access')) {
			return response(200, { access_token: 'fresh-token', valid_until: Date.now() + 3_600_000 })
		}

		apiCalls++
		if (init?.body === body) {
			if (body.used) {
				throw new Error('body used already')
			}

			body.used = true
		}

		return apiCalls === 1
			? response(401, {}, { 'www-authenticate': 'Bearer error="invalid_token"' })
			: response(200, {})
	})

	const auth = createHostedAuth({ apiOrigin: ORIGIN, fetch, flow: ticketFlow(), storage })
	await auth.restore()

	const res = await auth.fetch('/api/me', { body, method: 'POST' })
	assert.equal(res.status, 401)
	assert.equal(apiCalls, 2)
	assert.equal(requests[2].init?.headers?.authorization, 'Bearer fresh-token')
})

function deferred() {
	let resolve, reject
	const promise = new Promise((res, rej) => { resolve = res; reject = rej })
	return { promise, resolve, reject }
}

function lifecycleConfig(storage, overrides = {}) {
	return {
		apiOrigin: ORIGIN,
		storage,
		authSession: { supported: true, open: async () => ({ type: 'success', url: 'testapp://cb' }) },
		flow: { begin: async () => ({ url: `${ORIGIN}/login`, callbackScheme: 'testapp' }),
			complete: async () => JSON.parse(storedCreds()) },
		...overrides,
	}
}

for (const stage of ['begin', 'open', 'complete']) {
	test(`sign-out retires a pending ${stage} and permits a subsequent sign-in`, async () => {
		const { createHostedAuth } = loadHosted()
		const storage = memoryStore()
		const entered = deferred()
		const finish = deferred()
		const config = lifecycleConfig(storage)
		const owner = stage === 'open' ? config.authSession : config.flow
		const original = owner[stage]
		let calls = 0
		owner[stage] = async (...args) => {
			if (++calls === 1) { entered.resolve(); await finish.promise }
			return original(...args)
		}
		const auth = createHostedAuth(config)
		const stale = auth.signIn()
		await entered.promise
		await auth.signOut()
		assert.equal(await auth.restore(), 'unauthenticated')
		assert.equal((await auth.signIn()).status, 'success')
		finish.resolve()
		assert.equal((await stale).status, 'cancelled')
		assert.equal(await auth.restore(), 'authenticated')
		assert.equal(storage.map.size, 1)
	})
}

test('sign-out waits for an earlier save and removes it before a restart', async () => {
	const { createHostedAuth } = loadHosted()
	const storage = memoryStore()
	const entered = deferred()
	const finish = deferred()
	const config = lifecycleConfig({ ...storage, set: async (key, value) => {
		entered.resolve()
		await finish.promise
		await storage.set(key, value)
	} })
	const auth = createHostedAuth(config)
	const signingIn = auth.signIn()
	await entered.promise
	let signedOut = false
	const signingOut = auth.signOut().then(() => { signedOut = true })
	await Promise.resolve()
	assert.equal(await auth.restore(), 'unauthenticated')
	assert.equal(signedOut, false)
	finish.resolve()
	await signingOut
	assert.equal((await signingIn).status, 'cancelled')
	assert.equal(storage.map.size, 0)
	assert.equal(await createHostedAuth(config).restore(), 'unauthenticated')
})

test('sign-out clears and revokes credentials without requiring an earlier restore', async () => {
	const { createHostedAuth } = loadHosted()
	const storage = memoryStore()
	storage.map.set('hosted-auth', storedCreds())
	let revoked
	const config = lifecycleConfig(storage)
	config.flow.revoke = async (creds) => { revoked = creds.sessionToken }
	const auth = createHostedAuth(config)
	await auth.signOut()
	assert.equal(revoked, 'session-token')
	assert.equal(storage.map.size, 0)
	assert.equal(await auth.restore(), 'unauthenticated')
})

test('a delayed refresh save cannot return or restore a token after sign-out', async () => {
	const { createHostedAuth } = loadHosted()
	const storage = memoryStore()
	storage.map.set('hosted-auth', storedCreds({ expiresAt: 0 }))
	const entered = deferred()
	const finish = deferred()
	const config = lifecycleConfig({ ...storage, set: async (key, value) => {
		entered.resolve()
		await finish.promise
		await storage.set(key, value)
	} })
	config.flow.refresh = async () => JSON.parse(storedCreds({ token: 'fresh' }))
	const auth = createHostedAuth(config)
	const token = auth.getAccessToken()
	await entered.promise
	const signingOut = auth.signOut()
	finish.resolve()
	await signingOut
	assert.equal(await token, null)
	assert.equal(await createHostedAuth(config).restore(), 'unauthenticated')
})
