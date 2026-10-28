import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import worker from './src/worker.ts'

const SHA_A = 'a'.repeat(64)
const SHA_B = 'b'.repeat(64)

const POINTER = {
	version: '1.4.2',
	sha256: SHA_A,
	size: 123456,
	minNativeVersion: '1.2.0',
	releasedAt: '2026-10-06T00:00:00.000Z',
}

function bucketWith(objects) {
	const map = new Map(Object.entries(objects))
	return {
		async get(key) {
			if (!map.has(key)) {
				return null
			}

			const data = map.get(key)
			const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data
			return {
				body: new Response(bytes).body,
				size: bytes.byteLength,
				async text() {
					return new TextDecoder().decode(bytes)
				},
			}
		},
		async head(key) {
			return map.has(key) ? { size: map.get(key).length } : null
		},
	}
}

const env = { BUNDLES: bucketWith({ 'channels/stable/ios.json': JSON.stringify(POINTER) }) }

function get(path, env_ = env) {
	return worker.fetch(new Request(`https://ota.example.com${path}`), env_)
}

describe('GET /healthz', () => {
	it('returns ok', async () => {
		const res = await get('/healthz')
		assert.equal(res.status, 200)
		assert.equal(await res.text(), 'ok')
	})
})

describe('GET /manifest', () => {
	it('rejects a missing platform', async () => {
		const res = await get('/manifest')
		assert.equal(res.status, 400)
		assert.equal((await res.json()).error, 'bad-request')
	})

	it('rejects an invalid channel name', async () => {
		const res = await get('/manifest?platform=ios&channel=../x')
		assert.equal(res.status, 400)
	})

	it('rejects a malformed nativeVersion', async () => {
		const res = await get('/manifest?platform=ios&nativeVersion=1.2')
		assert.equal(res.status, 400)
	})

	it('returns no-release when the channel pointer is absent', async () => {
		const res = await get('/manifest?platform=android')
		assert.equal(res.status, 404)
		assert.equal((await res.json()).error, 'no-release')
	})

	it('returns the manifest with a computed bundle url', async () => {
		const res = await get('/manifest?platform=ios&nativeVersion=1.2.0')
		assert.equal(res.status, 200)
		const body = await res.json()
		assert.equal(body.updateAvailable, true)
		assert.equal(body.version, '1.4.2')
		assert.equal(body.sha256, SHA_A)
		assert.equal(body.minNativeVersion, '1.2.0')
		assert.equal(body.url, `https://ota.example.com/bundles/${SHA_A}`)
		assert.equal(res.headers.get('cache-control'), 'no-store')
	})

	it('reports up-to-date when currentVersion matches', async () => {
		const res = await get('/manifest?platform=ios&currentVersion=1.4.2')
		const body = await res.json()
		assert.equal(body.updateAvailable, false)
		assert.equal(body.reason, 'up-to-date')
	})

	it('gates on minNativeVersion', async () => {
		const res = await get('/manifest?platform=ios&nativeVersion=1.1.9')
		const body = await res.json()
		assert.equal(body.updateAvailable, false)
		assert.equal(body.reason, 'min-native-version')
		assert.equal(body.url, undefined)
	})

	it('serves the manifest when nativeVersion is omitted', async () => {
		const res = await get('/manifest?platform=ios')
		assert.equal((await res.json()).updateAvailable, true)
	})

	it('reports bad-pointer when the channel object is not a valid pointer', async () => {
		const bad = {
			BUNDLES: bucketWith({ 'channels/stable/ios.json': '{"version":"x"}' }),
		}

		const res = await get('/manifest?platform=ios', bad)
		assert.equal(res.status, 502)
		assert.equal((await res.json()).error, 'bad-pointer')
	})
})

describe('GET /bundles/<sha256>', () => {
	const bundles = {
		BUNDLES: bucketWith({ [`bundles/${SHA_B}`]: new Uint8Array([80, 75, 3, 4]) }),
	}

	it('streams the payload with immutable cache headers', async () => {
		const res = await get(`/bundles/${SHA_B}`, bundles)
		assert.equal(res.status, 200)
		assert.equal(res.headers.get('content-type'), 'application/zip')
		assert.equal(res.headers.get('etag'), `"${SHA_B}"`)
		assert.match(res.headers.get('cache-control'), /immutable/)
		assert.deepEqual([...new Uint8Array(await res.arrayBuffer())], [80, 75, 3, 4])
	})

	it('answers HEAD without a body', async () => {
		const res = await worker.fetch(
			new Request(`https://ota.example.com/bundles/${SHA_B}`, { method: 'HEAD' }),
			bundles,
		)

		assert.equal(res.status, 200)
		assert.equal(res.headers.get('content-length'), '4')
	})

	it('404s unknown hashes and rejects non-hex paths', async () => {
		assert.equal((await get(`/bundles/${'c'.repeat(64)}`, bundles)).status, 404)
		assert.equal((await get('/bundles/notaHash', bundles)).status, 400)
	})
})

describe('catch-all', () => {
	it('404s unknown routes', async () => {
		assert.equal((await get('/nope')).status, 404)
	})
})
