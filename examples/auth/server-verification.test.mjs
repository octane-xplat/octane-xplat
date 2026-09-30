import assert from 'node:assert/strict'
import test from 'node:test'
import { providerVerification, hostedVerification } from './server-verification.mjs'
const request = (body) =>
	new Request('https://example.test/verify', { method: 'POST', body: JSON.stringify(body) })

test('provider exchange forwards server-bound claims, rejects failed verification, and never trusts client identity', async () => {
	let calls = 0
	const handler = providerVerification({
		consumeAttempt: async () => ({
			provider: 'google',
			audience: 'server-audience',
			nonce: 'server-nonce',
		}),
		verifyIdToken: async (input) => {
			calls++
			assert.equal(input.audience, 'server-audience')
			assert.equal(input.nonce, 'server-nonce')
			throw new Error('private credential error')
		},
		createSession: () => {
			throw new Error('must not create a session')
		},
	})

	const result = await handler(
		request({ attemptId: 'one', provider: 'google', idToken: 'invalid', user: { id: 'forged' } }),
	)

	assert.equal(result.status, 401)
	assert.equal(await result.text(), '')
	assert.equal(calls, 1)
	assert.equal(
		(await handler(request({ attemptId: 'one', provider: 'unknown', idToken: 'invalid' }))).status,
		400,
	)
})

test('hosted exchange rejects wrong callback, duplicate parameters, mismatched state and replay before redemption', async () => {
	let consumed = false
	let redeemed = 0
	const handler = hostedVerification({
		callbackBase: 'sample://auth/callback',
		consumeAttempt: async () => {
			if (consumed) {return null}
			consumed = true
			return { state: 'expected', pkceVerifier: 'server-only' }
		},
		redeemCode: async () => {
			redeemed++
			return { subject: 'verified' }
		},
		createSession: async () => new Response(null, { status: 204 }),
	})

	for (const callbackURL of [
		'other://auth/callback?code=one&state=expected',
		'sample://auth/callback?code=one&code=two&state=expected',
	]) {
		assert.equal((await handler(request({ attemptId: 'one', callbackURL }))).status, 400)
	}

	assert.equal(consumed, false)
	assert.equal(
		(
			await handler(
				request({ attemptId: 'one', callbackURL: 'sample://auth/callback?code=one&state=wrong' }),
			)
		).status,
		401,
	)

	assert.equal(
		(
			await handler(
				request({
					attemptId: 'one',
					callbackURL: 'sample://auth/callback?code=one&state=expected',
				}),
			)
		).status,
		401,
	)

	assert.equal(redeemed, 0)
})
