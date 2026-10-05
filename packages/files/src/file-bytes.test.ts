import { describe, expect, it } from 'vitest'
import { assertSafeFileName, concatBytes, exactBuffer, throwIfAborted } from './file-bytes'

describe('assertSafeFileName', () => {
	it('accepts plain file names', () => {
		for (const name of ['a.txt', 'report 1.pdf', 'x.y.z.bin', 'résumé.md']) {
			expect(() => assertSafeFileName(name)).not.toThrow()
		}
	})

	it('rejects empty, dot, and traversal names', () => {
		for (const name of ['', '.', '..', '../x', 'a/b', 'a\\b', '..\\x', 'a\0b']) {
			expect(() => assertSafeFileName(name)).toThrow(/Unsafe file name/)
		}
	})
})

describe('throwIfAborted', () => {
	it('passes for live or absent signals', () => {
		expect(() => throwIfAborted(undefined)).not.toThrow()
		const controller = new AbortController()
		expect(() => throwIfAborted(controller.signal)).not.toThrow()
	})

	it('throws AbortError for aborted signals', () => {
		const controller = new AbortController()
		controller.abort()
		expect(() => throwIfAborted(controller.signal)).toThrowError(
			expect.objectContaining({ name: 'AbortError' }),
		)
	})
})

describe('concatBytes / exactBuffer', () => {
	it('concatenates chunks in order', () => {
		const joined = concatBytes(
			[new Uint8Array([1, 2]), new Uint8Array([3]), new Uint8Array([4, 5])],
			5,
		)

		expect([...joined]).toEqual([1, 2, 3, 4, 5])
	})

	it('returns the buffer only when the view covers it', () => {
		const buffer = new Uint8Array([9, 8, 7, 6]).buffer
		expect(exactBuffer(new Uint8Array(buffer))).toBe(buffer)

		const windowed = new Uint8Array(buffer, 1, 2)
		const exact = exactBuffer(windowed)
		expect(exact.byteLength).toBe(2)
		expect([...new Uint8Array(exact)]).toEqual([8, 7])
	})
})
