import { test } from 'node:test'
import assert from 'node:assert/strict'
import { svgDataUri } from '../dist/macos/svg-image.macos.js'
import { loadImage } from '../../macos-renderer/src/image.ts'
import { iconToSvg } from '../dist/web/svg.js'

test('macOS icon SVG uses UTF-8 base64 and reaches the image data decoder', () => {
	const old = {
		NSString: globalThis.NSString,
		NSData: globalThis.NSData,
		NSImage: globalThis.NSImage,
	}

	globalThis.NSString = {
		stringWithString: (value) => ({
			dataUsingEncoding: (encoding) => {
				assert.equal(encoding, 4)
				return {
					base64EncodedStringWithOptions: (options) => {
						assert.equal(options, 0)
						return Buffer.from(value, 'utf8').toString('base64')
					},
				}
			},
		}),
	}

	globalThis.NSData = {
		alloc: () => ({ initWithBase64EncodedStringOptions: (value) => Buffer.from(value, 'base64') }),
	}

	globalThis.NSImage = {
		alloc: () => ({
			initWithData: (data) => ({ markup: data.toString('utf8') }),
			initWithContentsOfFile: () => assert.fail('SVG must not be treated as a file path'),
		}),
	}

	try {
		const svg = iconToSvg(
			{ body: '<title>Étoile ★</title><path d="M0 0h32v16H0z"/>', width: 32, height: 16 },
			{ size: 24 },
		)

		const src = svgDataUri(svg.markup)
		assert.match(src, /^data:image\/svg\+xml;base64,/)
		assert.deepEqual(loadImage(src), { markup: svg.markup })
		globalThis.NSString.stringWithString = () => ({ dataUsingEncoding: () => null })
		assert.throws(() => svgDataUri(svg.markup), /Unable to encode SVG as UTF-8/)
	} finally {
		Object.assign(globalThis, old)
	}
})
