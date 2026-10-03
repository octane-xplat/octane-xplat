import assert from 'node:assert/strict'
import { test } from 'node:test'
import { loadImage } from '../src/image.ts'

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
