import { random } from './entropy'
import { backend } from './backend'
import { UnavailabilityError } from '@octane-xplat/lib/capability'
import { base64, hex, bufferBytes, utf8, options } from './bytes'
import type {
	CryptoBufferSource,
	CryptoCapabilities,
	CryptoDigestAlgorithm,
	CryptoDigestOptions,
	IntegerTypedArray,
} from './types'
/** Never falls back to Math.random, including development builds. */
export function getRandomBytes(byteCount: number): Uint8Array<ArrayBuffer> {
	if (!Number.isInteger(byteCount) || byteCount < 0 || byteCount > 1024) {
		throw new TypeError('byteCount must be an integer from 0 to 1024')
	}
	if (!random.supported) {
		throw new UnavailabilityError('Crypto secure randomness')
	}
	return random.bytes(byteCount).slice()
}
export async function getRandomBytesAsync(byteCount: number): Promise<Uint8Array<ArrayBuffer>> {
	return getRandomBytes(byteCount)
}
/** Fills only this integer view; the Web Crypto 65,536-byte quota applies everywhere. */
export function getRandomValues<T extends IntegerTypedArray>(typedArray: T): T {
	if (
		!ArrayBuffer.isView(typedArray) ||
		!/^\[object (?:Uint8Clamped|(?:U?Int|Uint|Int)(?:8|16|32)|BigInt64|BigUint64)Array\]$/.test(
			Object.prototype.toString.call(typedArray),
		)
	) {
		throw new TypeError('Expected an integer typed array')
	}
	if (typedArray.byteLength > 65536) {
		throw new RangeError('getRandomValues accepts at most 65536 bytes')
	}
	if (!random.supported) {
		throw new UnavailabilityError('Crypto secure randomness')
	}
	return random.fill(typedArray)
}
export function randomUUID(): string {
	const bytes = getRandomBytes(16)
	bytes[6] = (bytes[6]! & 15) | 64
	bytes[8] = (bytes[8]! & 63) | 128
	const text = hex(bytes)
	return `${text.slice(0, 8)}-${text.slice(8, 12)}-${text.slice(12, 16)}-${text.slice(16, 20)}-${text.slice(20)}`
}
/** Hash a snapshot of the exact buffer/view; unsupported algorithms reject. */
export async function digest(
	algorithm: CryptoDigestAlgorithm,
	data: CryptoBufferSource,
): Promise<ArrayBuffer> {
	if (!backend.capabilities().digestAlgorithms.includes(algorithm)) {
		throw new UnavailabilityError(`Crypto digest ${algorithm}`)
	}
	return (await backend.digest(algorithm, bufferBytes(data))).buffer
}
/** UTF-8 string digest; hexadecimal output is lowercase and base64 is padded. */
export async function digestStringAsync(
	algorithm: CryptoDigestAlgorithm,
	data: string,
	value: CryptoDigestOptions = { encoding: 'hex' },
): Promise<string> {
	if (typeof data !== 'string') {
		throw new TypeError('Expected a string to hash')
	}
	options(value, ['encoding'])
	if (value.encoding !== 'hex' && value.encoding !== 'base64') {
		throw new TypeError('Digest encoding must be hex or base64')
	}
	const result = new Uint8Array(await digest(algorithm, utf8(data)))
	return value.encoding === 'hex' ? hex(result) : base64(result)
}
export const Crypto = {
	get capabilities(): CryptoCapabilities {
		return { random: random.supported, ...backend.capabilities() }
	},
	get supported(): boolean {
		const value = backend.capabilities()
		return random.supported || value.digestAlgorithms.length > 0 || value.aesKeySizes.length > 0
	},
}
