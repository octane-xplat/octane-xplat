import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createAppKitImageCache, validateAppKitImageOptions } from '../src/cache-bridge.macos.ts'

test('the optional AppKit adapter delegates disk warming, queries, eviction and clear to the renderer owner', async () => {
	const calls: unknown[] = [], cache = createAppKitImageCache(() => ({
		initialize: () => { calls.push('initialize'); return true }, prefetch: async (source) => { calls.push(source); return true },
		isCached: (source) => source === 'first' ? 'memory' : 'disk', evict: (source) => { calls.push(['evict', source]); return true }, clear: () => { calls.push('clear'); return true },
	}))
	cache.initialize(); assert.equal(await cache.prefetch(['first', 'second'], { concurrency: 1 }), true)
	assert.deepEqual(await cache.query(['first', 'second']), { first: 'memory', second: 'disk' }); assert.equal(await cache.evict('first'), true); await cache.clear()
	assert.deepEqual(calls, ['initialize', 'first', 'second', ['evict', 'first'], 'clear'])
})
test('missing hosts and backend failures degrade honestly; failed clear rejects instead of claiming a purge', async () => {
	const missing = createAppKitImageCache(() => undefined)
	assert.equal(await missing.prefetch('one'), false); assert.equal(await missing.evict('one'), false); assert.deepEqual(await missing.query('one'), { one: 'none' }); await missing.clear()
	const fail = () => { throw Error('backend refused') }, failed = createAppKitImageCache(() => ({ initialize: fail, prefetch: fail, evict: fail, clear: fail, isCached: fail }))
	assert.equal(await failed.prefetch('one'), false); assert.equal(await failed.evict('one'), false); assert.deepEqual(await failed.query('one'), { one: 'none' }); await assert.rejects(failed.clear(), /backend refused/)
	const incomplete = createAppKitImageCache(() => ({ initialize: () => false, prefetch: async () => false, evict: () => false, clear: () => false, isCached: () => 'none' }))
	await assert.rejects(incomplete.clear(), /could not be cleared/)
})
test('unsupported headers/configuration and decode-transform queries never imply engine support', async () => {
	let calls = 0
	const cache = createAppKitImageCache(() => ({ initialize: () => true, prefetch: async () => { calls++; return true }, isCached: () => 'memory', evict: () => true, clear: () => true }))
	assert.throws(() => cache.initialize({ memoryCacheSize: 1024 }), /not implemented/)
	assert.equal(await cache.prefetch('one', { headers: { Authorization: 'test-only' } }), false); assert.equal(calls, 0)
	assert.deepEqual(await cache.query('one', { decodeWidth: 20 }), { one: 'none' })
	assert.equal(await cache.prefetch([], { headers: {} }), true)
})
test('cache query keys remain own enumerable data fields even for special object-property names', async () => {
	const cache = createAppKitImageCache(() => undefined), result = await cache.query(['__proto__', 'constructor'])
	assert.equal(Object.getPrototypeOf(result), Object.prototype); assert.deepEqual(Object.keys(result), ['__proto__', 'constructor']); assert.equal(result.__proto__, 'none')
})
test('public prefetch caps bridge concurrency and stops dequeuing after a failed warm', async () => {
	const pending: { source: string; resolve(value: boolean): void }[] = []
	const cache = createAppKitImageCache(() => ({ initialize: () => true, isCached: () => 'none', evict: () => true, clear: () => true,
		prefetch: (source) => new Promise((resolve) => pending.push({ source, resolve })),
	}))
	const task = cache.prefetch(['one', 'two', 'three'], { concurrency: 1 })
	assert.deepEqual(pending.map((item) => item.source), ['one'])
	pending[0].resolve(true); await Promise.resolve(); await Promise.resolve()
	assert.deepEqual(pending.map((item) => item.source), ['one', 'two'])
	pending[1].resolve(false); assert.equal(await task, false); assert.equal(pending.length, 2)
})

test('unsupported display cache bypass and headers fail before a default persistent load can start', () => {
	assert.doesNotThrow(() => validateAppKitImageOptions({}))
	assert.doesNotThrow(() => validateAppKitImageOptions({ cachePolicy: 'memory-disk', headers: {} }))
	assert.throws(() => validateAppKitImageOptions({ cachePolicy: 'none' }), /cachePolicy="none"/)
	assert.throws(() => validateAppKitImageOptions({ headers: { Authorization: 'test-only' } }), /headers are not implemented/)
})
