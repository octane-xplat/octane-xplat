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
