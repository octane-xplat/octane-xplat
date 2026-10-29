import assert from 'node:assert/strict'
import test from 'node:test'
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from 'jose'
import { createApi } from './api.ts'

const issuer = 'https://login.example.test/'
const audience = 'https://api.example.test'
const { publicKey, privateKey } = await generateKeyPair('RS256')
const keys = createLocalJWKSet({ keys: [await exportJWK(publicKey)] })
const api = createApi({ issuer, audience, keys })
const token = (claims = {}, key = privateKey) =>
	new SignJWT({ sub: 'person-1', ...claims })
		.setProtectedHeader({ alg: 'RS256' })
		.setIssuedAt()
		.setExpirationTime('2m')
		.setIssuer(issuer)
		.setAudience(audience)
		.sign(key)
const request = (credential, path = '/api/me', method = 'GET') =>
	new Request(`https://api.example.test${path}`, {
		method,
		headers: credential ? { Authorization: `Bearer ${credential}` } : {},
	})

test('a cryptographically verified token returns only its own subject without caching', async () => {
	const response = await api(request(await token()))
	assert.equal(response.status, 200)
	assert.deepEqual(await response.json(), { subject: 'person-1' })
	assert.equal(response.headers.get('cache-control'), 'no-store')
})

test('missing or malformed credentials cannot access the subject', async () => {
	assert.equal((await api(request())).status, 401)
	assert.equal((await api(request('invalid'))).status, 401)
})

test('another issuer, audience, expired token or missing subject is rejected', async () => {
	for (const [name, value] of [
		['issuer', 'https://other.test/'],
		['audience', 'other-api'],
		['expiry', 1],
		['subject', ''],
	]) {
		const builder = new SignJWT({ sub: name === 'subject' ? value : 'person-1' })
			.setProtectedHeader({ alg: 'RS256' })
			.setIssuedAt()
			.setExpirationTime(name === 'expiry' ? value : '2m')
			.setIssuer(name === 'issuer' ? value : issuer)
			.setAudience(name === 'audience' ? value : audience)
		const response = await api(request(await builder.sign(privateKey)))
		assert.equal(response.status, 401)
		assert.equal(response.headers.get('www-authenticate'), 'Bearer error="invalid_token"')
	}
})

test('a token signed by an untrusted key is rejected', async () => {
	const untrusted = await generateKeyPair('RS256')
	assert.equal((await api(request(await token({}, untrusted.privateKey)))).status, 401)
})

test('the endpoint does not accept arbitrary methods or paths', async () => {
	assert.equal((await api(request(undefined, '/api/me', 'POST'))).status, 405)
	assert.equal((await api(request(undefined, '/api/something-else'))).status, 404)
})

test('key-service failures offer recovery without challenging a valid session', async () => {
	const unavailable = createApi({
		issuer,
		audience,
		keys: async () => {
			throw new Error('offline')
		},
	})
	const response = await unavailable(request(await token()))
	assert.equal(response.status, 503)
	assert.equal(response.headers.get('www-authenticate'), null)
})

test('issuer configuration requires an exact HTTPS origin and audience', () => {
	for (const invalid of [
		'http://login.example.test/',
		'https://login.example.test',
		'https://user:password@login.example.test/',
		'https://login.example.test/path/',
	]) {
		assert.throws(() => createApi({ issuer: invalid, audience, keys }))
	}
	assert.throws(() => createApi({ issuer, audience: '', keys }))
})
