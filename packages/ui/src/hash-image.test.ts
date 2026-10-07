import { describe, expect, it } from 'vitest'
import { hashToPngBase64, isHashPlaceholder } from './hash-image'

const PNG_MAGIC = 'iVBORw0KGgo'

function pngBytes(base64: string) {
	return Buffer.from(base64, 'base64')
}

function pngSize(base64: string) {
	const bytes = pngBytes(base64)
	return {
		width: bytes.readUInt32BE(16),
		height: bytes.readUInt32BE(20),
		bitDepth: bytes[24],
		colorType: bytes[25],
	}
}

describe('isHashPlaceholder', () => {
	it('accepts blurhash: and thumbhash: schemes only', () => {
		expect(isHashPlaceholder('blurhash:LEHV6nWB2yk8pyo0adR*.7kCMdnj')).toBe(true)
		expect(isHashPlaceholder('thumbhash:1QcSHQRnh493V4dIh4eXh1h4kJUI')).toBe(true)
		expect(isHashPlaceholder('https://x/y.png')).toBe(false)
		expect(isHashPlaceholder('res://icon')).toBe(false)
	})
})

describe('hashToPngBase64', () => {
	it('decodes a blurhash to a 32x32 RGBA PNG', () => {
		const png = hashToPngBase64('blurhash:LEHV6nWB2yk8pyo0adR*.7kCMdnj')
		expect(png).not.toBeNull()
		expect(png!.startsWith(PNG_MAGIC)).toBe(true)
		expect(pngSize(png!)).toEqual({ width: 32, height: 32, bitDepth: 8, colorType: 6 })
	})

	it('decodes a thumbhash to a bounded PNG', () => {
		const png = hashToPngBase64('thumbhash:1QcSHQRnh493V4dIh4eXh1h4kJUI')
		expect(png).not.toBeNull()
		expect(png!.startsWith(PNG_MAGIC)).toBe(true)
		const size = pngSize(png!)
		expect(size.width).toBeGreaterThan(0)
		expect(size.width).toBeLessThanOrEqual(32)
		expect(size.height).toBeGreaterThan(0)
		expect(size.height).toBeLessThanOrEqual(32)
	})

	it('produces non-uniform pixel data (real decode, not a flat fill)', () => {
		const png = hashToPngBase64('blurhash:LGF5]+Yk^6#M@-5c,1J5@[or[Q6.')
		const bytes = pngBytes(png!)
		const unique = new Set(bytes.subarray(60))
		expect(unique.size).toBeGreaterThan(8)
	})

	it('is deterministic', () => {
		const src = 'blurhash:LEHV6nWB2yk8pyo0adR*.7kCMdnj'
		expect(hashToPngBase64(src)).toBe(hashToPngBase64(src))
	})

	it.each([
		'blurhash:',
		'blurhash:abc',
		'blurhash:!!!!!!!!!!!!!!!!!',
		'thumbhash:',
		'thumbhash:%%%',
		'thumbhash:AAAA',
		'https://x/y.png',
		'plain string',
	])('returns null for %s', (src) => {
		expect(hashToPngBase64(src)).toBeNull()
	})
})
