import { test } from 'node:test'
import assert from 'node:assert/strict'
import { rendererImageFixture as fixture } from './fixtures/renderer-image.ts'
test('remote processing waits for the main queue and rejects HTTP error payloads', async () => {
	const env = fixture(), view: any = { image: null }
	try {
		env.updateImage(view, 'https://image-test/main-queue'); await env.start()
		env.tasks[0].handler('bytes', { statusCode: 200 }, null); assert.equal(view.image, null); assert.equal(env.decodes(), 0)
		env.flush(); assert.deepEqual(view.image, { data: 'bytes' })
		env.updateImage(view, 'https://image-test/http-error'); await env.start()
		env.tasks[1].handler('error-image', { statusCode: 404 }, null); env.flush()
		assert.equal(view.image, null); assert.equal(env.decodes(), 1)
	} finally { env.disposeImage(view) }
})
test('shared remote work stays alive for another view and cancels queued delivery after the final removal', async () => {
	const env = fixture(), first: any = { image: null }, second: any = { image: null }, retry: any = { image: null }
	try {
		env.updateImage(first, 'https://image-test/shared'); env.updateImage(second, 'https://image-test/shared'); await env.start()
		env.disposeImage(first); assert.equal(env.tasks[0].cancelled, 0)
		env.tasks[0].handler('shared', { statusCode: 200 }, null); env.disposeImage(second); assert.equal(env.tasks[0].cancelled, 1)
		env.flush(); assert.equal(env.decodes(), 0); assert.equal(first.image, null); assert.equal(second.image, null)
		env.updateImage(retry, 'https://image-test/shared'); await env.start(); assert.equal(env.tasks.length, 2)
		env.tasks[1].handler('retry', { statusCode: 200 }, null); env.flush(); assert.deepEqual(retry.image, { data: 'retry' })
	} finally { for (const view of [first, second, retry]) env.disposeImage(view) }
})
test('invalid URLs, setup failures and resume failures settle without poisoning retries', async () => {
	const env = fixture(), view: any = { image: null }, retry: any = { image: null }
	try {
		env.updateImage(view, 'https://image-test/invalid'); await env.start(); assert.equal(env.tasks.length, 0)
		env.failStart(true); env.updateImage(view, 'https://image-test/setup'); await env.start(); assert.equal(view.image, null)
		env.failStart(false); env.failResume(true); env.updateImage(view, 'https://image-test/resume'); await env.start(); assert.equal(env.tasks[0].cancelled, 1)
		env.failResume(false); env.updateImage(retry, 'https://image-test/setup'); await env.start()
		env.tasks[1].handler('retry', { statusCode: 200 }, null); env.flush(); assert.deepEqual(retry.image, { data: 'retry' })
	} finally { for (const field of [view, retry]) env.disposeImage(field) }
})
test('a missing main-queue bridge fails before network setup and permits a later retry', async () => {
	const env = fixture(), first: any = { image: null }, retry: any = { image: null }, queue = env.native.NSOperationQueue.mainQueue
	try {
		env.native.NSOperationQueue.mainQueue = null
		env.updateImage(first, 'https://image-test/queue-unavailable'); await env.start(); assert.equal(first.image, null); assert.equal(env.tasks.length, 0)
		env.native.NSOperationQueue.mainQueue = queue
		env.updateImage(retry, 'https://image-test/queue-unavailable'); await env.start()
		env.tasks[0].handler('retry', { statusCode: 200 }, null); env.flush(); assert.deepEqual(retry.image, { data: 'retry' })
	} finally { for (const view of [first, retry]) env.disposeImage(view) }
})
test('combined eviction preserves live delivery while an older response cannot replace newer memory or disk bytes', async () => {
	const env = fixture(), src = 'https://image-test/eviction', first: any = { image: null }, next: any = { image: null }, hit: any = { image: null }
	try {
		env.updateImage(first, src); await env.start(); assert.equal(env.imageCache.evict(src), true)
		env.updateImage(next, src); await env.start(); assert.equal(env.tasks.length, 2); assert.equal(env.tasks[0].cancelled, 0)
		env.tasks[1].handler('fresh', { statusCode: 200 }, null); env.flush()
		env.tasks[0].handler('old', { statusCode: 200 }, null); env.flush()
		assert.deepEqual(first.image, { data: 'old' }); assert.deepEqual(next.image, { data: 'fresh' }); assert.equal(env.imageCache.isCached(src), 'memory')
		env.updateImage(hit, src); assert.deepEqual(hit.image, { data: 'fresh' }); assert.equal(env.tasks.length, 2); assert.equal(env.disk.get(src).data, 'fresh')
		env.imageCache.evict(src); assert.equal(env.imageCache.isCached(src), 'none'); assert.deepEqual(hit.image, { data: 'fresh' })
	} finally { for (const view of [first, next, hit]) env.disposeImage(view) }
})
test('combined clear between HTTP completion and main-queue decode cannot rewarm old data or cancel live delivery', async () => {
	const env = fixture(), src = 'https://image-test/clear', first: any = { image: null }, next: any = { image: null }
	try {
		env.updateImage(first, src); await env.start(); env.tasks[0].handler('old', { statusCode: 200 }, null)
		assert.equal(env.imageCache.clear(), true); env.flush()
		assert.deepEqual(first.image, { data: 'old' }); assert.equal(env.imageCache.isCached(src), 'none'); assert.equal(env.tasks[0].cancelled, 0)
		env.updateImage(next, src); await env.start(); assert.equal(env.tasks.length, 2)
		env.tasks[1].handler('fresh', { statusCode: 200 }, null); env.flush(); assert.equal(env.imageCache.isCached(src), 'memory')
	} finally { for (const view of [first, next]) env.disposeImage(view) }
})
test('prefetched encoded bytes serve a later mounted image and memory-only invalidation leaves disk available', async () => {
	const env = fixture(), src = 'https://image-test/prefetched', first: any = { image: null }, next: any = { image: null }
	try {
		const warm = env.imageCache.prefetch(src); await env.start(); env.tasks[0].handler('prefetched', { statusCode: 200 }, null); env.flush()
		assert.equal(await warm, true); assert.equal(env.decodes(), 0); assert.equal(env.imageCache.isCached(src), 'disk')
		env.updateImage(first, src); await env.start(); assert.equal(env.tasks.length, 1); assert.equal(env.imageCache.isCached(src), 'memory')
		env.imageMemoryCache.clear(); assert.deepEqual(first.image, { data: 'prefetched' }); assert.equal(env.imageCache.isCached(src), 'disk')
		env.updateImage(next, src); await env.start(); assert.equal(env.tasks.length, 1); assert.deepEqual(next.image, { data: 'prefetched' })
	} finally { for (const view of [first, next]) env.disposeImage(view) }
})
