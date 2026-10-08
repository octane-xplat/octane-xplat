import assert from 'node:assert/strict'
import { test } from 'node:test'
import { disposeImage, loadImage, updateImage } from '../src/image.ts'

test('embedded and local image sources decode without network access; empty sources clear', () => {
	const old = { NSImage: globalThis.NSImage, NSData: globalThis.NSData, NSURL: globalThis.NSURL }
	globalThis.NSImage = {
		alloc: () => ({
			initWithData: (data) => ({ data }),
			initWithContentsOfFile: (path) => ({ path }),
			initWithContentsOfURL: (url) => ({ url }),
		}),
	}

	globalThis.NSData = {
		alloc: () => ({ initWithBase64EncodedStringOptions: (value, options) => ({ value, options }) }),
	}

	globalThis.NSURL = { URLWithString: (value) => value }
	try {
		assert.deepEqual(loadImage('data:image/png;base64,YQ=='), {
			data: { value: 'YQ==', options: 0 },
		})

		assert.deepEqual(loadImage('/tmp/photo.png'), { path: '/tmp/photo.png' })
		assert.deepEqual(loadImage('file:///tmp/photo.png'), { url: 'file:///tmp/photo.png' })
		assert.equal(loadImage(''), null)
	} finally {
		Object.assign(globalThis, old)
	}
})

test('uncached sources decode off the caller path; cached, stale and disposed loads are guarded', async () => {
	const old = { NSImage: globalThis.NSImage, NSData: globalThis.NSData, NSURL: globalThis.NSURL }
	let decodes = 0
	globalThis.NSImage = {
		alloc: () => ({
			initWithData: (data) => ({ data }),
			initWithContentsOfFile: (path) => {
				decodes++
				return { path }
			},
			initWithContentsOfURL: (url) => ({ url }),
		}),
	}

	globalThis.NSData = {
		alloc: () => ({ initWithBase64EncodedStringOptions: (value, options) => ({ value, options }) }),
	}

	globalThis.NSURL = { URLWithString: (value) => value }
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
		Object.assign(globalThis, old)
	}
})
