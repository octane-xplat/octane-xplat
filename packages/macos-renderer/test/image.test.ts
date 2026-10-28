import assert from 'node:assert/strict'
import { test } from 'node:test'
import { disposeImage, loadImage, updateImage } from '../src/image.ts'
import { mockGlobals } from './mock-globals.ts'
import { rendererImageFixture } from './fixtures/renderer-image.ts'

test('embedded and local image sources decode without network access; empty sources clear', () => {
	const restore = mockGlobals({
		NSImage: {
			alloc: () => ({
				initWithData: (data) => ({ data }),
				initWithContentsOfFile: (path) => ({ path }),
				initWithContentsOfURL: (url) => ({ url }),
			}),
			imageNamed: (name) => ({ named: name }),
		},
		NSData: {
			alloc: () => ({
				initWithBase64EncodedStringOptions: (value, options) => ({ value, options }),
			}),
		},
		NSURL: { URLWithString: (value) => value },
		NSBundle: { mainBundle: { resourcePath: '/app/Contents/Resources' } },
	})

	try {
		assert.deepEqual(loadImage('data:image/png;base64,YQ=='), {
			data: { value: 'YQ==', options: 0 },
		})

		assert.deepEqual(loadImage('/tmp/photo.png'), { path: '/tmp/photo.png' })
		assert.deepEqual(loadImage('file:///tmp/photo.png'), { url: 'file:///tmp/photo.png' })
		assert.deepEqual(loadImage('res://icon'), { named: 'icon' })
		assert.deepEqual(loadImage('~/photo.png'), { path: '/app/Contents/Resources/photo.png' })
		assert.equal(loadImage(''), null)
	} finally {
		restore()
	}
})

test('uncached sources decode off the caller path; cached, stale and disposed loads are guarded', async () => {
	const restore = mockGlobals({
		NSImage: {
			alloc: () => ({
				initWithData: (data) => ({ data }),
				initWithContentsOfFile: (path) => {
					decodes++
					return { path }
				},
				initWithContentsOfURL: (url) => ({ url }),
			}),
		},
		NSData: {
			alloc: () => ({
				initWithBase64EncodedStringOptions: (value, options) => ({ value, options }),
			}),
		},
		NSURL: { URLWithString: (value) => value },
	})

	let decodes = 0
	const tick = () => new Promise((resolve) => setTimeout(resolve, 0))
	try {
		// A fresh source defers the decode instead of blocking the caller.
		const view = { image: null }
		updateImage(view, '/tmp/a.png')
		assert.equal(view.image, null)
		await tick()
		assert.deepEqual(view.image, { path: '/tmp/a.png' })

		// Another view showing the same source hits the cache synchronously.
		const cached = { image: null }
		updateImage(cached, '/tmp/a.png')
		assert.deepEqual(cached.image, { path: '/tmp/a.png' })
		assert.equal(decodes, 1)

		// Concurrent requests for one source share a single decode.
		const first = { image: null }
		const second = { image: null }
		updateImage(first, '/tmp/shared.png')
		updateImage(second, '/tmp/shared.png')
		await tick()
		assert.deepEqual(first.image, { path: '/tmp/shared.png' })
		assert.deepEqual(second.image, { path: '/tmp/shared.png' })
		assert.equal(decodes, 2)

		// A newer source supersedes a decode still in flight.
		updateImage(view, '/tmp/stale.png')
		updateImage(view, '/tmp/fresh.png')
		await tick()
		assert.deepEqual(view.image, { path: '/tmp/fresh.png' })

		// Disposal invalidates a decode still in flight.
		const dropped = { image: null }
		updateImage(dropped, '/tmp/dropped.png')
		disposeImage(dropped)
		await tick()
		assert.equal(dropped.image, null)

		// An empty source clears synchronously.
		updateImage(view, '')
		assert.equal(view.image, null)
	} finally {
		restore()
	}
})

test('remote sources use owned transport; placeholders paint while pending and remain on failure', async () => {
	const env = rendererImageFixture(), placeholder = 'data:image/png;base64,YQ=='
	const expected = { data: { value: 'YQ==', options: 0 } }, views: any[] = []
	const view = () => { const next: any = { image: null }; views.push(next); return next }
	try {
		const first = view(); env.updateImage(first, 'https://x/photo.png', placeholder)
		assert.deepEqual(first.image, expected); await env.start(); assert.equal(env.tasks.length, 1)
		env.tasks[0].handler({ remote: 'photo-bytes' }, { statusCode: 200 }, null); env.flush()
		assert.deepEqual(first.image, { data: { remote: 'photo-bytes' } })
		const cached = view(); env.updateImage(cached, 'https://x/photo.png', placeholder)
		assert.deepEqual(cached.image, { data: { remote: 'photo-bytes' } }); assert.equal(env.tasks.length, 1)
		const failing = view(); env.updateImage(failing, 'https://x/missing.png', placeholder)
		assert.deepEqual(failing.image, expected); await env.start()
		env.tasks[1].handler(null, null, Error('404')); env.flush(); assert.deepEqual(failing.image, expected)
		const bare = view(); env.updateImage(bare, 'https://x/gone.png'); await env.start()
		env.tasks[2].handler(null, null, Error('500')); env.flush(); assert.equal(bare.image, null)
		const swapped = view(); env.updateImage(swapped, 'https://x/old.png', placeholder); await env.start()
		env.updateImage(swapped, 'data:image/png;base64,Yg==', placeholder)
		assert.equal(env.tasks.length, 4); assert.equal(env.tasks[3].cancelled, 1)
		env.tasks[3].handler({ remote: 'old-bytes' }, { statusCode: 200 }, null); env.flush(); await env.start()
		assert.deepEqual(swapped.image, { data: { value: 'Yg==', options: 0 } })
		const empty = view(); env.updateImage(empty, '', placeholder); assert.deepEqual(empty.image, expected)
	} finally { for (const field of views) env.disposeImage(field) }
})
