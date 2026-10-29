import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

async function compile(path, dependencies) {
	const exports = {}
	const code = ts.transpile(await readFile(new URL(path, import.meta.url), 'utf8'), {
		module: ts.ModuleKind.CommonJS,
		target: ts.ScriptTarget.ES2022,
	})
	vm.runInNewContext(code, { exports, require: (name) => dependencies[name] ?? {} })
	return exports
}
const helpers = await compile('../src/hosted.ts', {})
const { createAuth0Flow } = await compile('../examples/auth0-flow.ts', {
	'@octane-xplat/auth': helpers,
	'@octane-xplat/platform': {
		random: { bytes: (n) => Uint8Array.from({ length: n }, (_, i) => i) },
	},
})
const config = {
	issuer: 'https://login.example.test',
	clientId: 'native-client',
	audience: 'https://api.example.test',
	redirectUri: 'packing://auth/callback',
}
const pkce = { verifier: 'secret-verifier', challenge: 'public-challenge' }
const valid = {
	access_token: 'access',
	refresh_token: 'refresh',
	token_type: 'Bearer',
	expires_in: 3600,
}
function transport(body = valid, status = 200) {
	const requests = []
	return {
		requests,
		fetch: async (url, init) => {
			requests.push({ url, init })
			return { ok: status < 300, status, json: async () => body }
		},
	}
}

test('configuration requires the HTTPS provider origin and a native callback scheme', () => {
	assert.throws(() => createAuth0Flow({ ...config, issuer: 'http://login.example.test' }))
	assert.throws(() =>
		createAuth0Flow({ ...config, redirectUri: 'https://app.example.test/callback' }),
	)
})

test('authorization binds a fresh state, public client, callback and S256 challenge without exposing the verifier', async () => {
	const attempt = await createAuth0Flow(config).begin({ pkce })
	const url = new URL(attempt.url)
	assert.equal(url.origin, config.issuer)
	assert.equal(url.pathname, '/authorize')
	assert.equal(url.searchParams.get('client_id'), config.clientId)
	assert.equal(url.searchParams.get('redirect_uri'), config.redirectUri)
	assert.equal(url.searchParams.get('audience'), config.audience)
	assert.equal(url.searchParams.get('code_challenge_method'), 'S256')
	assert.equal(url.searchParams.get('code_challenge'), pkce.challenge)
	assert.equal(url.searchParams.get('state'), attempt.state)
	assert.equal(attempt.callbackScheme, 'packing')
	assert.ok(url.searchParams.get('scope').includes('offline_access'))
	assert.equal(attempt.state.length, 32)
	assert.ok(!attempt.url.includes(pkce.verifier))
})

test('exchange sends the same callback and verifier, then converts seconds to a credential expiry', async () => {
	const flow = createAuth0Flow(config)
	const attempt = await flow.begin({ pkce })
	const io = transport()
	const before = Date.now()
	const credentials = await flow.complete(
		`${config.redirectUri}?code=one-use&state=${attempt.state}`,
		attempt,
		{ pkce, fetch: io.fetch },
	)
	assert.equal(io.requests[0].url, `${config.issuer}/oauth/token`)
	assert.deepEqual(JSON.parse(io.requests[0].init.body), {
		grant_type: 'authorization_code',
		client_id: config.clientId,
		code: 'one-use',
		code_verifier: pkce.verifier,
		redirect_uri: config.redirectUri,
	})
	assert.equal(credentials.token, 'access')
	assert.equal(credentials.sessionToken, 'refresh')
	assert.ok(credentials.expiresAt >= before + 3600_000)
	assert.ok(credentials.expiresAt <= Date.now() + 3600_000)
})

test('invalid destination, state, fragment, provider error and missing code never reach token exchange', async () => {
	const flow = createAuth0Flow(config)
	const attempt = await flow.begin({ pkce })
	const io = transport()
	for (const callback of [
		`other://auth/callback?code=c&state=${attempt.state}`,
		`packing://different/callback?code=c&state=${attempt.state}`,
		`packing://auth/wrong?code=c&state=${attempt.state}`,
		`${config.redirectUri}?code=c&state=wrong`,
		`${config.redirectUri}?code=c&state=${attempt.state}#fragment`,
		`${config.redirectUri}?error=access_denied&state=${attempt.state}`,
		`${config.redirectUri}?state=${attempt.state}`,
	]) {
		assert.equal(await flow.complete(callback, attempt, { pkce, fetch: io.fetch }), null)
	}
	assert.equal(io.requests.length, 0)
})

test('refresh uses and rotates the durable credential; providers may retain the old refresh token', async () => {
	const flow = createAuth0Flow(config)
	const previous = { token: 'old-access', sessionToken: 'old-refresh', expiresAt: 1 }
	for (const [response, expected] of [
		[valid, 'refresh'],
		[{ ...valid, refresh_token: undefined }, 'old-refresh'],
	]) {
		const io = transport(response)
		const next = await flow.refresh(previous, { fetch: io.fetch })
		assert.equal(JSON.parse(io.requests[0].init.body).refresh_token, 'old-refresh')
		assert.equal(next.sessionToken, expected)
	}
})

test('revoked refresh clears the session while temporary errors remain retryable', async () => {
	const flow = createAuth0Flow(config)
	const previous = { token: 'old', sessionToken: 'refresh', expiresAt: 1 }
	assert.equal(
		await flow.refresh(previous, { fetch: transport({ error: 'invalid_grant' }, 400).fetch }),
		null,
	)
	await assert.rejects(
		flow.refresh(previous, { fetch: transport({ error: 'server_error' }, 503).fetch }),
		/temporarily unavailable/,
	)
})

test('malformed and incomplete token responses cannot become a session', async () => {
	const flow = createAuth0Flow(config)
	const attempt = await flow.begin({ pkce })
	for (const response of [
		null,
		{},
		{ ...valid, refresh_token: '' },
		{ ...valid, expires_in: 0 },
		{ ...valid, expires_in: 1e300 },
		{ ...valid, token_type: 'other' },
	]) {
		await assert.rejects(
			flow.complete(`${config.redirectUri}?code=c&state=${attempt.state}`, attempt, {
				pkce,
				fetch: transport(response).fetch,
			}),
			/usable session/,
		)
	}
})

test('revocation uses the durable refresh credential and no client secret', async () => {
	const io = transport({}, 200)
	await createAuth0Flow(config).revoke(
		{ token: 'access', sessionToken: 'durable', expiresAt: 1 },
		{ fetch: io.fetch },
	)
	assert.equal(io.requests[0].url, `${config.issuer}/oauth/revoke`)
	assert.deepEqual(JSON.parse(io.requests[0].init.body), {
		client_id: config.clientId,
		token: 'durable',
	})
})
