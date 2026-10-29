import { describe, expect, it } from 'vitest'
import {
	hashToPngBase64,
	isHashPlaceholder,
	rgbaToThumbHash,
	rgbaToThumbHashUri,
	thumbHashTargetSize,
	unpremultiplyRGBA,
} from './hash-image'

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

// Expected values produced by the reference encoder (evanw/thumbhash,
// js/thumbhash.js) over the same fixtures — the port must be byte-identical.
describe('rgbaToThumbHash', () => {
	const gradient16x12 = new Uint8Array(16 * 12 * 4)
	for (let y = 0; y < 12; y++) {
		for (let x = 0; x < 16; x++) {
			const i = (x + y * 16) * 4
			gradient16x12[i] = (x * 17) & 255
			gradient16x12[i + 1] = (y * 21) & 255
			gradient16x12[i + 2] = ((x + y) * 9) & 255
			gradient16x12[i + 3] = 255
		}
	}

	const alpha8x8 = new Uint8Array(8 * 8 * 4)
	for (let y = 0; y < 8; y++) {
		for (let x = 0; x < 8; x++) {
			const i = (x + y * 8) * 4
			alpha8x8[i] = 200 - x * 10
			alpha8x8[i + 1] = 60 + y * 20
			alpha8x8[i + 2] = 90
			alpha8x8[i + 3] = 64 + x * 24
		}
	}

	it.each([
		['16x12 opaque gradient', 16, 12, gradient16x12, 'HhgODZxwd3dxeHiHiHiHiIuAB+eI'],
		['8x8 alpha ramp', 8, 8, alpha8x8, 'nzmGFQopa3iQh3h4iGuQt/aGcId4iIeIhw=='],
		['1x1 solid', 1, 1, new Uint8Array([77, 42, 201, 255]), 'mkM2HxMI9wiIh4hwj3CI+AiIcH/4CIgA'],
	])('matches the reference byte-for-byte: %s', (_name, w, h, rgba, expected) => {
		expect(Buffer.from(rgbaToThumbHash(w, h, rgba)).toString('base64')).toBe(expected)
	})

	it('produces a thumbhash: URI that decodes back to a placeholder PNG', () => {
		const uri = rgbaToThumbHashUri(16, 12, gradient16x12)
		expect(uri).toBe('thumbhash:HhgODZxwd3dxeHiHiHiHiIuAB+eI')
		const png = hashToPngBase64(uri)
		expect(png).not.toBeNull()
		// The decode preserves the source aspect ratio approximately —
		// 16:12 rounds into the 7:5 thumbnail grid — within the 32px cap.
		expect(pngSize(png!)).toEqual({ width: 32, height: 23, bitDepth: 8, colorType: 6 })
		// A real image survives the round-trip — not a flat fill.
		const unique = new Set(pngBytes(png!).subarray(60))
		expect(unique.size).toBeGreaterThan(8)
	})

	it('rejects images larger than 100px like the reference does', () => {
		expect(() => rgbaToThumbHash(101, 50, new Uint8Array(101 * 50 * 4))).toThrow('101x50')
	})

	it('thumbHashTargetSize preserves aspect within the 100px cap', () => {
		expect(thumbHashTargetSize(16, 12)).toEqual([16, 12])
		expect(thumbHashTargetSize(400, 200)).toEqual([100, 50])
		expect(thumbHashTargetSize(50, 400)).toEqual([13, 100])
		expect(thumbHashTargetSize(1, 1)).toEqual([1, 1])
	})

	it('unpremultiplyRGBA restores straight alpha within one quantum', () => {
		// Premultiplied storage of (200,60,90,a=64): rounds down to (50,15,23).
		const rgba = new Uint8Array([50, 15, 23, 64])
		unpremultiplyRGBA(rgba)
		expect(Array.from(rgba)).toEqual([199, 60, 92, 64])
		// Opaque and fully-transparent channels pass through unchanged.
		const passthrough = new Uint8Array([10, 20, 30, 255, 0, 0, 0, 0])
		unpremultiplyRGBA(passthrough)
		expect(Array.from(passthrough)).toEqual([10, 20, 30, 255, 0, 0, 0, 0])
	})
})
