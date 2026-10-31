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
	} finally { for (const view of [first, second, retry]) {env.disposeImage(view)} }
})
test('invalid URLs, setup failures and resume failures settle without poisoning retries', async () => {
	const env = fixture(), view: any = { image: null }, retry: any = { image: null }
	try {
		env.updateImage(view, 'https://image-test/invalid'); await env.start(); assert.equal(env.tasks.length, 0)
		env.failStart(true); env.updateImage(view, 'https://image-test/setup'); await env.start(); assert.equal(view.image, null)
		env.failStart(false); env.failResume(true); env.updateImage(view, 'https://image-test/resume'); await env.start(); assert.equal(env.tasks[0].cancelled, 1)
		env.failResume(false); env.updateImage(retry, 'https://image-test/setup'); await env.start()
		env.tasks[1].handler('retry', { statusCode: 200 }, null); env.flush(); assert.deepEqual(retry.image, { data: 'retry' })
	} finally { for (const field of [view, retry]) {env.disposeImage(field)} }
})
test('a missing main-queue bridge fails before network setup and permits a later retry', async () => {
	const env = fixture(), first: any = { image: null }, retry: any = { image: null }, queue = env.native.NSOperationQueue.mainQueue
	try {
		env.native.NSOperationQueue.mainQueue = null
		env.updateImage(first, 'https://image-test/queue-unavailable'); await env.start(); assert.equal(first.image, null); assert.equal(env.tasks.length, 0)
		env.native.NSOperationQueue.mainQueue = queue
		env.updateImage(retry, 'https://image-test/queue-unavailable'); await env.start()
		env.tasks[0].handler('retry', { statusCode: 200 }, null); env.flush(); assert.deepEqual(retry.image, { data: 'retry' })
	} finally { for (const view of [first, retry]) {env.disposeImage(view)} }
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
	} finally { for (const view of [first, next, hit]) {env.disposeImage(view)} }
})
test('combined clear between HTTP completion and main-queue decode cannot rewarm old data or cancel live delivery', async () => {
	const env = fixture(), src = 'https://image-test/clear', first: any = { image: null }, next: any = { image: null }
	try {
		env.updateImage(first, src); await env.start(); env.tasks[0].handler('old', { statusCode: 200 }, null)
		assert.equal(env.imageCache.clear(), true); env.flush()
		assert.deepEqual(first.image, { data: 'old' }); assert.equal(env.imageCache.isCached(src), 'none'); assert.equal(env.tasks[0].cancelled, 0)
		env.updateImage(next, src); await env.start(); assert.equal(env.tasks.length, 2)
		env.tasks[1].handler('fresh', { statusCode: 200 }, null); env.flush(); assert.equal(env.imageCache.isCached(src), 'memory')
	} finally { for (const view of [first, next]) {env.disposeImage(view)} }
})
test('prefetched encoded bytes serve a later mounted image and memory-only invalidation leaves disk available', async () => {
	const env = fixture(), src = 'https://image-test/prefetched', first: any = { image: null }, next: any = { image: null }
	try {
		const warm = env.imageCache.prefetch(src); await env.start(); env.tasks[0].handler('prefetched', { statusCode: 200 }, null); env.flush()
		assert.equal(await warm, true); assert.equal(env.decodes(), 0); assert.equal(env.imageCache.isCached(src), 'disk')
		env.updateImage(first, src); await env.start(); assert.equal(env.tasks.length, 1); assert.equal(env.imageCache.isCached(src), 'memory')
		env.imageMemoryCache.clear(); assert.deepEqual(first.image, { data: 'prefetched' }); assert.equal(env.imageCache.isCached(src), 'disk')
		env.updateImage(next, src); await env.start(); assert.equal(env.tasks.length, 1); assert.deepEqual(next.image, { data: 'prefetched' })
	} finally { for (const view of [first, next]) {env.disposeImage(view)} }
})

test('a bypass view ignores warm decoded/disk entries and cannot replace the default cache', async () => {
	const env = fixture(), src = 'https://image-test/bypass', cached: any = { image: null }, bypass: any = { image: null }, hit: any = { image: null }
	try {
		env.updateImage(cached, src); await env.start(); env.tasks[0].handler('older', { statusCode: 200 }, null); env.flush()
		env.updateImage(bypass, src, undefined, 'none'); assert.equal(bypass.image, null); await env.start(); assert.equal(env.tasks.length, 2)
		env.tasks[1].handler('fresh', { statusCode: 200 }, null); env.flush(); assert.deepEqual(bypass.image, { data: 'fresh' })
		assert.equal(env.disk.get(src).data, 'older'); env.updateImage(hit, src); assert.deepEqual(hit.image, { data: 'older' })
		const calls = env.tasks.length; env.updateImage(bypass, src, undefined, 'none'); await env.start(); assert.equal(env.tasks.length, calls)
	} finally { for (const view of [cached, bypass, hit]) {env.disposeImage(view)} }
})
test('same-source policy changes retire queued old delivery and restoring the default can reuse its own cache', async () => {
	const env = fixture(), src = 'https://image-test/policy-change', first: any = { image: null }, retained: any = { image: null }
	try {
		env.updateImage(first, src); env.updateImage(retained, src); await env.start(); env.tasks[0].handler('default', { statusCode: 200 }, null)
		env.updateImage(first, src, undefined, 'none'); await env.start(); env.flush()
		assert.equal(first.image, null); assert.deepEqual(retained.image, { data: 'default' }); assert.equal(env.tasks.length, 2)
		env.updateImage(first, src, undefined, null); assert.deepEqual(first.image, { data: 'default' }); assert.equal(env.tasks[1].cancelled, 1)
		env.tasks[1].handler('late bypass', { statusCode: 200 }, null); env.flush(); assert.deepEqual(first.image, { data: 'default' })
	} finally { for (const view of [first, retained]) {env.disposeImage(view)} }
})
test('a bypass-only view does not warm memory/disk and teardown retires queued completion', async () => {
	const env = fixture(), src = 'https://image-test/bypass-only', first: any = { image: null }, next: any = { image: null }
	try {
		env.updateImage(first, src, undefined, 'none'); await env.start(); env.tasks[0].handler('uncached', { statusCode: 200 }, null); env.flush()
		assert.deepEqual(first.image, { data: 'uncached' }); assert.equal(env.imageMemoryCache.isCached(src), false); assert.equal(env.disk.size, 0)
		env.updateImage(next, src, undefined, 'none'); await env.start(); assert.equal(env.tasks.length, 2)
		env.tasks[1].handler('retired', { statusCode: 200 }, null); env.disposeImage(next); env.flush(); assert.equal(next.image, null); assert.equal(env.disk.size, 0)
	} finally { for (const view of [first, next]) {env.disposeImage(view)} }
})
test('local bypass loads avoid the framework decode cache and leave a default local cache entry intact', async () => {
	const env = fixture(), src = '/local/policy.png', first: any = { image: null }, next: any = { image: null }, cached: any = { image: null }, hit: any = { image: null }
	try {
		env.updateImage(first, src, undefined, 'none'); await env.start(); assert.deepEqual(first.image, { path: src }); assert.equal(env.imageMemoryCache.isCached(src), false)
		env.updateImage(next, src, undefined, 'none'); assert.equal(next.image, null); await env.start(); assert.notEqual(next.image, first.image)
		env.updateImage(cached, src); await env.start(); env.updateImage(hit, src); assert.equal(hit.image, cached.image)
	} finally { for (const view of [first, next, cached, hit]) {env.disposeImage(view)} }
})

test('placeholder paint teardown retires a late bypass subscription before native network work starts', async () => {
	const env = fixture(), src = 'https://image-test/placeholder-retire', view: any = {}, retry: any = { image: null }
	let painted: any = null
	Object.defineProperty(view, 'image', { get: () => painted, set: (image) => { painted = image; env.disposeImage(view) } })
	try {
		env.updateImage(view, src, 'data:image/png;base64,YQ==', 'none'); await env.start(); assert.equal(env.tasks.length, 0)
		env.updateImage(retry, src, undefined, 'none'); await env.start(); assert.equal(env.tasks.length, 1)
		env.tasks[0].handler('current', { statusCode: 200 }, null); env.flush(); assert.deepEqual(retry.image, { data: 'current' })
	} finally { env.disposeImage(view); env.disposeImage(retry) }
})
test('cached paint reentry cannot replace a newer source subscription with the old cache-hit release', async () => {
	const env = fixture(), src = 'https://image-test/paint-reentry', seed: any = { image: null }, view: any = {}
	let painted: any = null, replaced = false
	Object.defineProperty(view, 'image', { get: () => painted, set: (image) => { painted = image; if (!replaced) { replaced = true; env.updateImage(view, 'https://image-test/new-owned', undefined, 'none') } } })
	try {
		env.updateImage(seed, src); await env.start(); env.tasks[0].handler('cached', { statusCode: 200 }, null); env.flush()
		env.updateImage(view, src); env.disposeImage(view); await env.start(); assert.equal(env.tasks.length, 1)
	} finally { env.disposeImage(seed); env.disposeImage(view) }
})
test('native cancellation reentry owns the latest source instead of losing its release or starting the outer replacement', async () => {
	const env = fixture(), view: any = { image: null }
	try {
		env.updateImage(view, 'https://image-test/cancel-first', undefined, 'none'); await env.start()
		env.tasks[0].cancel = () => { env.tasks[0].cancelled++; env.updateImage(view, 'https://image-test/cancel-current', undefined, 'none') }
		env.updateImage(view, 'https://image-test/cancel-retired', undefined, 'none'); await env.start()
		assert.equal(env.tasks.length, 2); assert.equal(env.tasks[1].request.URL, 'https://image-test/cancel-current')
		env.disposeImage(view); assert.equal(env.tasks[1].cancelled, 1)
	} finally { env.disposeImage(view) }
})
