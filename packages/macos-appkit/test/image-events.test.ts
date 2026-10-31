import { test } from 'node:test'
import assert from 'node:assert/strict'
import { rendererImageFixture } from './fixtures/renderer-image.ts'
const tick = async (env: ReturnType<typeof rendererImageFixture>) => { await env.start(); env.flush(); await env.start() }

test('load events defer through handler installation and report actual network, decoded-memory and disk origins', async () => {
	const env = rendererImageFixture(), src = 'https://image-test/events-origin', views = [{ image: null }, { image: null }, { image: null }], loads: any[] = []
	try {
		env.setImageEventHandlers(views[0], { onLoad: (event: any) => loads.push({ ...event }) })
		env.updateImage(views[0], src); await env.start(); env.tasks[0].handler('bytes', { statusCode: 200 }, null); env.flush()
		assert.deepEqual(loads, []); await env.start(); assert.deepEqual(loads, [{ width: 64, height: 32, source: 'network' }])
		env.updateImage(views[1], src) // Creation may assign a cached image before binding handlers.
		env.setImageEventHandlers(views[1], { onLoad: (event: any) => loads.push({ ...event }) }); await env.start(); assert.equal(loads[1].source, 'memory')
		env.imageMemoryCache.clear(); env.setImageEventHandlers(views[2], { onLoad: (event: any) => loads.push({ ...event }) })
		env.updateImage(views[2], src); await tick(env); assert.equal(loads[2].source, 'disk'); assert.equal(env.tasks.length, 1)
	} finally { views.forEach(env.disposeImage) }
})
test('failure reports a generic Error once, preserves placeholders and never emits load for placeholder/empty-source updates', async () => {
	const env = rendererImageFixture(), view: any = { image: null }, errors: string[] = [], loads: any[] = [], src = 'https://image-test/failure?token=test-only'
	try {
		env.setImageEventHandlers(view, { onLoad: (event: any) => loads.push(event), onError: (event: any) => errors.push(event.error.message) })
		env.updateImage(view, src, 'data:image/png;base64,YQ=='); await env.start(); env.tasks[0].handler(null, { statusCode: 404 }, {}); env.flush()
		assert.deepEqual(errors, []); await env.start(); assert.deepEqual(errors, ['AppKit image load or decode failed']); assert.equal(errors[0].includes('token='), false)
		env.updateImage(view, src, 'data:image/png;base64,Yg=='); await tick(env); assert.equal(env.tasks.length, 1); assert.equal(errors.length, 1); assert.deepEqual(loads, [])
		assert.deepEqual(view.image, { data: { value: 'Yg==', options: 0 } }); env.updateImage(view, ''); await tick(env); assert.equal(view.image, null); assert.equal(errors.length, 1)
	} finally { env.disposeImage(view) }
})
test('callbacks read current handlers, removal suppresses pending work and adding one after completion does not replay', async () => {
	const env = rendererImageFixture(), view: any = { image: null }, completed: any = { image: null }, calls: string[] = []
	try {
		env.setImageEventHandlers(view, { onLoad: () => calls.push('old') }); env.updateImage(view, '/events/current.png'); await env.start()
		env.setImageEventHandlers(view, { onLoad: () => calls.push('current') }); await env.start(); assert.deepEqual(calls, ['current'])
		env.updateImage(view, '/events/removed.png'); await env.start(); env.setImageEventHandlers(view); await env.start(); assert.deepEqual(calls, ['current'])
		env.updateImage(completed, '/events/completed.png'); await tick(env); env.setImageEventHandlers(completed, { onLoad: () => calls.push('replay') })
		env.updateImage(completed, '/events/completed.png'); await tick(env); assert.deepEqual(calls, ['current'])
	} finally { env.disposeImage(view); env.disposeImage(completed) }
})
test('source/policy changes and disposal retire terminal notifications queued for the previous request', async () => {
	const env = rendererImageFixture(), view: any = { image: null }, sourceView: any = { image: null }, calls: string[] = [], src = 'https://image-test/event-retire'
	try {
		env.setImageEventHandlers(view, { onLoad: () => calls.push('retired') }); env.updateImage(view, src); await env.start(); env.tasks[0].handler('bytes', { statusCode: 200 }, null); env.flush()
		env.updateImage(view, src, undefined, 'none'); await env.start(); assert.deepEqual(calls, [])
		env.tasks[1].handler('bypass', { statusCode: 200 }, null); env.flush(); env.disposeImage(view); await env.start(); assert.deepEqual(calls, [])
		env.setImageEventHandlers(sourceView, { onLoad: (event: any) => calls.push(event.source) }); env.updateImage(sourceView, src); env.updateImage(sourceView, '/events/new-source.png')
		await tick(env); assert.deepEqual(calls, ['local'])
	} finally { env.disposeImage(view); env.disposeImage(sourceView) }
})
test('placeholder updates keep the pending request and cannot cover a completed image or repeat its callback', async () => {
	const env = rendererImageFixture(), view: any = { image: null }, src = 'https://image-test/event-placeholder', loads: string[] = []
	try {
		env.setImageEventHandlers(view, { onLoad: (event: any) => { loads.push(event.source); env.updateImage(view, src, 'data:image/png;base64,Yw==') } })
		env.updateImage(view, src, 'data:image/png;base64,YQ=='); await env.start(); env.updateImage(view, src, 'data:image/png;base64,Yg==')
		assert.equal(env.tasks[0].cancelled, 0); await env.start(); assert.equal(env.tasks.length, 1)
		env.tasks[0].handler('final', { statusCode: 200 }, null); env.flush(); await tick(env)
		assert.deepEqual(loads, ['network']); assert.deepEqual(view.image, { data: 'final' }); assert.equal(env.tasks.length, 1)
	} finally { env.disposeImage(view) }
})
test('load callback source replacement owns its own subsequent completion', async () => {
	const env = rendererImageFixture(), view: any = { image: null }, calls: string[] = []
	try {
		env.setImageEventHandlers(view, { onLoad: (event: any) => { calls.push(event.source); if (calls.length === 1) {env.updateImage(view, '/events/second.png')} } })
		env.updateImage(view, '/events/first.png'); await tick(env); await tick(env)
		assert.deepEqual(calls, ['local', 'local']); assert.deepEqual(view.image, { path: '/events/second.png' })
	} finally { env.disposeImage(view) }
})
test('consumer callback exceptions stay separate from load errors and cannot strand another observer', async () => {
	const env = rendererImageFixture(), first: any = { image: null }, next: any = { image: null }, calls: string[] = []
	try {
		env.setImageEventHandlers(first, { onLoad: () => { throw Error('consumer failed') }, onError: () => calls.push('false error') })
		env.setImageEventHandlers(next, { onLoad: () => calls.push('loaded') }); env.updateImage(first, '/events/shared.png'); env.updateImage(next, '/events/shared.png'); await tick(env)
		assert.deepEqual(calls, ['loaded']); assert.equal(env.errors.length, 1)
	} finally { env.disposeImage(first); env.disposeImage(next) }
})
test('failed native assignment reports error; unavailable pixel metadata remains a successful zero-sized notification', async () => {
	const env = rendererImageFixture(), broken: any = {}, unknown: any = { image: null }, calls: any[] = []
	Object.defineProperty(broken, 'image', { get: () => null, set: () => { throw Error('native paint failed') } })
	try {
		env.setImageEventHandlers(broken, { onLoad: () => calls.push('false load'), onError: (event: any) => calls.push(event.error.message) })
		env.updateImage(broken, '/events/broken.png'); await tick(env); assert.deepEqual(calls, ['AppKit image display failed'])
		env.setImageEventHandlers(unknown, { onLoad: (event: any) => calls.push({ ...event }) }); env.updateImage(unknown, '/events/unknown.png'); await env.start()
		unknown.image.representations.length = 0; await env.start(); assert.deepEqual(calls[1], { width: 0, height: 0, source: 'local' })
	} finally { env.disposeImage(broken); env.disposeImage(unknown) }
})
test('placeholder assignment failure does not stop the actual image source or emit a false source error', async () => {
	const env = rendererImageFixture(), src = 'https://image-test/placeholder-paint-error', view: any = {}, calls: string[] = []
	let painted: any = null
	Object.defineProperty(view, 'image', { get: () => painted, set: (image) => { if (image?.data && typeof image.data === 'object') {throw Error('placeholder paint failed');} painted = image } })
	try {
		env.setImageEventHandlers(view, { onLoad: () => calls.push('loaded'), onError: () => calls.push('false error') })
		env.updateImage(view, src, 'data:image/png;base64,YQ=='); await env.start(); env.tasks[0].handler('actual image', { statusCode: 200 }, null); env.flush(); await env.start()
		assert.deepEqual(calls, ['loaded']); assert.deepEqual(painted, { data: 'actual image' }); assert.equal(env.errors.length, 1)
	} finally { env.disposeImage(view) }
})
