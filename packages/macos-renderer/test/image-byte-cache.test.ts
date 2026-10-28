import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createImageByteCache } from '../src/image-byte-cache.ts'
import { imageCacheFixture } from './fixtures/image-cache.ts'
const src = 'https://image-test/bytes'

test('prefetch uses an image-owned disk cache and isolated transport, stores bytes without decode and shares current work', async () => {
	const env = imageCacheFixture(), cache = createImageByteCache(() => env.native)
	const first = cache.prefetch(src), second = cache.prefetch(src)
	await env.start(); assert.equal(env.tasks.length, 1)
	assert.deepEqual(env.configurations[0], { URLCache: null, HTTPCookieStorage: null, URLCredentialStorage: null, HTTPShouldSetCookies: false, requestCachePolicy: 1 })
	assert.deepEqual(env.configurations[1], { memory: 0, capacity: 64 * 1024 * 1024, path: '/cache/octane-xplat-images-v1/test.image-cache' })
	env.tasks[0].handler('encoded', { statusCode: 200 }, null); assert.equal(env.disk.size, 0); env.flush()
	assert.equal(await first, true); assert.equal(await second, true); assert.equal(cache.isCached(src), true)
	const hit = cache.prefetch(src); await env.start(); assert.equal(await hit, true); assert.equal(env.tasks.length, 1)
})
test('later instances can read the same image-owned disk cache without fetching or decoding', async () => {
	const env = imageCacheFixture(), cache = createImageByteCache(() => env.native), warm = cache.prefetch(src)
	await env.start(); env.tasks[0].handler('encoded', { statusCode: 200 }, null); env.flush(); assert.equal(await warm, true)
	const next = imageCacheFixture(env.disk), nextCache = createImageByteCache(() => next.native), read = nextCache.prefetch(src)
	await next.start(); assert.equal(await read, true); assert.equal(next.tasks.length, 0)
})
test('noncacheable/protected/varying responses remain displayable but never report successful disk warming', async () => {
	for (const headers of [{ 'Cache-Control': 'no-store' }, { 'cache-control': 'public, private' }, { 'Cache-Control': 'no-cache="field"' }, { Vary: 'Accept' }, { 'Set-Cookie': 'session' }]) {
		const env = imageCacheFixture(), cache = createImageByteCache(() => env.native), data: any[] = []
		cache.subscribe(src, (value) => data.push(value)); const warm = cache.prefetch(src); await env.start()
		env.tasks[0].handler('bytes', { statusCode: 200, allHeaderFields: headers }, null); env.flush()
		assert.equal(await warm, false); assert.equal(data[0].data, 'bytes'); assert.equal(env.disk.size, 0)
	}
})
test('HTTP errors, transport failures and rejected writes cannot claim disk success', async () => {
	for (const failure of ['http', 'transport', 'write', 'read', 'queue', 'resume', 'setup']) {
		const env = imageCacheFixture(), cache = createImageByteCache(() => env.native)
		env.writable(failure !== 'write'); env.readable(failure !== 'read');
		if (failure === 'queue') env.native.NSOperationQueue.mainQueue.addOperationWithBlock = () => { throw Error('queue unavailable') }
		env.failStart(failure === 'setup'); env.failResume(failure === 'resume')
		const warm = cache.prefetch(src); await env.start()
		if (!['resume', 'setup'].includes(failure)) { env.tasks[0].handler('bytes', { statusCode: failure === 'http' ? 404 : 200 }, failure === 'transport' ? {} : null); env.flush() }
		assert.equal(await warm, false); assert.equal(env.disk.size, failure === 'read' ? 1 : 0)
	}
})
test('missing disk ownership still permits display transport and never falls back to shared caching', async () => {
	const env = imageCacheFixture(); env.directory(false)
	const cache = createImageByteCache(() => env.native), data: any[] = []
	cache.subscribe(src, (value) => data.push(value)); const warm = cache.prefetch(src); await env.start()
	env.tasks[0].handler('bytes', { statusCode: 200 }, null); env.flush()
	assert.equal(data[0].data, 'bytes'); assert.equal(await warm, false); assert.equal(cache.isCached(src), false)
})
test('eviction retires old disk writers while preserving subscribed delivery and newer requests', async () => {
	const env = imageCacheFixture(), cache = createImageByteCache(() => env.native), data: any[] = []
	cache.subscribe(src, (value) => data.push(value)); await env.start(); assert.equal(cache.evict(src), true)
	const warm = cache.prefetch(src); await env.start(); assert.equal(env.tasks.length, 2)
	env.tasks[1].handler('fresh', { statusCode: 200 }, null); env.flush(); assert.equal(await warm, true)
	env.tasks[0].handler('old', { statusCode: 200 }, null); env.flush()
	assert.equal(data[0].data, 'old'); assert.equal(data[0].stored, false); assert.equal(env.disk.get(src).data, 'fresh')
})
test('clear invalidates queued network writers and cancelled subscribers cannot populate disk', async () => {
	const env = imageCacheFixture(), cache = createImageByteCache(() => env.native)
	const warm = cache.prefetch(src); await env.start(); env.tasks[0].handler('old', { statusCode: 200 }, null)
	assert.equal(cache.clear(), true); env.flush(); assert.equal(await warm, false); assert.equal(env.disk.size, 0)
	const release = cache.subscribe(src, () => assert.fail('cancelled delivery')); await env.start()
	env.tasks[1].handler('cancelled', { statusCode: 200 }, null); release(); env.flush()
	assert.equal(env.disk.size, 0); assert.equal(env.tasks[1].cancelled, 1)
})
test('unsupported/invalid sources and unavailable main queue settle without reserving network work', async () => {
	const env = imageCacheFixture(), cache = createImageByteCache(() => env.native)
	assert.equal(await cache.prefetch('file:///local'), false); assert.equal(await cache.prefetch('https://image-test/invalid'), false)
	env.native.NSOperationQueue.mainQueue = null; assert.equal(await cache.prefetch(src), false); assert.equal(env.tasks.length, 0)
})
test('native NSDictionary response headers participate in storage policy', async () => {
	const env = imageCacheFixture(), cache = createImageByteCache(() => env.native)
	const warm = cache.prefetch(src); await env.start()
	const names = ['cAcHe-CoNtRoL'], headers = { allKeys: { count: 1, objectAtIndex: (index: number) => names[index] }, objectForKey: () => 'no-store' }
	env.tasks[0].handler('bytes', { statusCode: 200, allHeaderFields: headers }, null); env.flush()
	assert.equal(await warm, false); assert.equal(env.disk.size, 0)
})
