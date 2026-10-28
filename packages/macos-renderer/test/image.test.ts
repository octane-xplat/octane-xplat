import assert from 'node:assert/strict'
import { test } from 'node:test'
import { disposeImage, loadImage, updateImage } from '../src/image.ts'
import { mockGlobals } from './mock-globals.ts'

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

test('remote sources fetch through NSURLSession; placeholder paints while pending and stands on failure', async () => {
	const tasks: any[] = []
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
		NSURLRequest: { requestWithURL: (url) => ({ url }) },
		NSURLCache: {
			sharedURLCache: {
				cachedResponseForRequest: (request) => staged[request.url] ?? null,
			},
		},
		NSOperationQueue: { mainQueue: { addOperationWithBlock: (block) => block() } },
		NSURLSession: {
			sharedSession: {
				dataTaskWithURLCompletionHandler: (url, handler) => {
					const task = {
						url,
						handler,
						resumed: false,
						cancel() {},
						resume() {
							this.resumed = true
						},
					}
					tasks.push(task)
					return task
				},
			},
		},
	})

	const staged: Record<string, any> = {}
	const placeholder = 'data:image/png;base64,YQ=='
	const placeholderImage = { data: { value: 'YQ==', options: 0 } }
	try {
		// While the fetch is pending, the placeholder paints into the same view.
		const view = { image: null }
		updateImage(view, 'https://x/photo.png', placeholder)
		assert.deepEqual(view.image, placeholderImage)
		assert.equal(tasks.length, 1)
		assert.equal(tasks[0].resumed, true)

		// A resolved fetch replaces the placeholder.
		tasks[0].handler({ remote: 'photo-bytes' }, { statusCode: 200 }, null)
		assert.deepEqual(view.image, { data: { remote: 'photo-bytes' } })

		// A second view for the same URL hits the cache synchronously and
		// never paints its placeholder.
		const cached = { image: null }
		updateImage(cached, 'https://x/photo.png', placeholder)
		assert.deepEqual(cached.image, { data: { remote: 'photo-bytes' } })
		assert.equal(tasks.length, 1)

		// A failed fetch leaves the placeholder standing.
		const failing = { image: null }
		updateImage(failing, 'https://x/missing.png', placeholder)
		assert.deepEqual(failing.image, placeholderImage)
		tasks[1].handler(null, null, new Error('404'))
		assert.deepEqual(failing.image, placeholderImage)

		// No placeholder: failure clears the view.
		const bare = { image: null }
		updateImage(bare, 'https://x/gone.png')
		tasks[2].handler(null, null, new Error('500'))
		assert.equal(bare.image, null)

		// A superseding source invalidates a fetch still in flight.
		const swapped = { image: null }
		updateImage(swapped, 'https://x/old.png', placeholder)
		updateImage(swapped, 'data:image/png;base64,Yg==', placeholder)
		assert.equal(tasks.length, 4)
		tasks[3].handler({ remote: 'old-bytes' }, { statusCode: 200 }, null)
		await new Promise((resolve) => setTimeout(resolve, 0))
		assert.deepEqual(swapped.image, { data: { value: 'Yg==', options: 0 } })

		// An empty source with a placeholder shows the placeholder.
		const empty = { image: null }
		updateImage(empty, '', placeholder)
		assert.deepEqual(empty.image, placeholderImage)

		// A response staged in the shared URL cache (prefetch warm) decodes
		// without opening a session task.
		staged['https://x/warm.png'] = { data: { remote: 'warm-bytes' } }
		const warmed = { image: null }
		updateImage(warmed, 'https://x/warm.png')
		assert.equal(tasks.length, 4)
		await new Promise((resolve) => setTimeout(resolve, 0))
		assert.deepEqual(warmed.image, { data: { remote: 'warm-bytes' } })
	} finally {
		restore()
	}
})
