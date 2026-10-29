import { afterEach, expect, it, vi } from 'vitest'
vi.mock('../src/backend', () => import('../src/backend.web'))
vi.mock('../src/entropy', () => import('../src/entropy.web'))
import { run } from './conformance'
import { base64, decodeBase64, utf8, hex } from '../src/bytes'
import {
	getRandomBytes,
	AESEncryptionKey,
	aesEncryptAsync,
	digestStringAsync,
	getRandomValues,
} from '../src/index'
afterEach(() => vi.unstubAllGlobals())
it('matches published digest/AES vectors, byte boundaries, ownership and authentication failures', async () => {
	let count = 0
	await run({
		assert(name, actual, expected) {
			expect(actual, name).toEqual(expected)
			count++
		},
		record() {},
	})
	expect(count).toBeGreaterThanOrEqual(43)
})
it('matches native-independent text and base64 encoding, including malformed input', () => {
	for (const text of ['', 'a', 'ab', 'abc', '你好 🌍', '\ud800x', 'x\udfff']) {
		expect(utf8(text)).toEqual(new TextEncoder().encode(text))
	}
	for (let length = 0; length < 100; length++) {
		const bytes = Uint8Array.from({ length }, (_, i) => (i * 31) & 255)
		expect(base64(bytes)).toEqual(Buffer.from(bytes).toString('base64'))
		expect(decodeBase64(base64(bytes))).toEqual(bytes)
	}
	for (const value of ['a', 'AA===', 'AA=A', 'ab==', 'AA-_', 'AA==\n']) {
		expect(() => decodeBase64(value)).toThrow()
	}
})
it('fails closed when the secure source is absent or throws', async () => {
	vi.stubGlobal('crypto', undefined)
	expect(() => getRandomBytes(8)).toThrow()
	await expect(AESEncryptionKey.generate()).rejects.toThrow()
	vi.stubGlobal('crypto', {
		getRandomValues() {
			throw new Error('OS random failure')
		},
	})
	expect(() => getRandomBytes(8)).toThrow('OS random failure')
})
it('accepts all integer views and rejects invalid counts and encodings', async () => {
	for (const Type of [
		Int8Array,
		Uint8Array,
		Uint8ClampedArray,
		Int16Array,
		Uint16Array,
		Int32Array,
		Uint32Array,
		BigInt64Array,
		BigUint64Array,
	]) {
		const view = new Type(2)
		expect(getRandomValues(view)).toBe(view)
	}
	for (const count of [-1, 1.5, NaN, Infinity]) {
		expect(() => getRandomBytes(count)).toThrow()
	}
	await expect(digestStringAsync('SHA-256', 'abc', { encoding: 'utf8' } as never)).rejects.toThrow()
	const source = new Uint8Array([5, ...Array(16).fill(0), 6]),
		key = await AESEncryptionKey.import(source.subarray(1, 17))
	source.fill(9)
	expect(hex(await key.bytes())).toBe('00000000000000000000000000000000')
	const nodeBytes = Buffer.alloc(16)
	const nodeKey = await AESEncryptionKey.import(nodeBytes)
	nodeBytes.fill(7)
	expect(hex(await nodeKey.bytes())).toBe('00000000000000000000000000000000')
	await expect(
		aesEncryptAsync(new Uint8Array(), key, {
			nonce: { bytes: new Uint8Array(12), length: 12 },
		} as never),
	).rejects.toThrow()
})
