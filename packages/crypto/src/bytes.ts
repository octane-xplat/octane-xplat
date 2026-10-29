import type { BinaryInput, CryptoBufferSource } from './types'
const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
export function base64(bytes: Uint8Array): string {
	let out = ''
	for (let index = 0; index < bytes.length; index += 3) {
		const a = bytes[index]!,
			b = bytes[index + 1] ?? 0,
			c = bytes[index + 2] ?? 0
		out +=
			alphabet[a >>> 2]! +
			alphabet[((a & 3) << 4) | (b >>> 4)]! +
			(index + 1 < bytes.length ? alphabet[((b & 15) << 2) | (c >>> 6)] : '=') +
			(index + 2 < bytes.length ? alphabet[c & 63] : '=')
	}
	return out
}
export function decodeBase64(value: string): Uint8Array<ArrayBuffer> {
	if (
		typeof value !== 'string' ||
		!/^[A-Za-z0-9+/]*={0,2}$/.test(value) ||
		value.length % 4 === 1
	) {
		throw new TypeError('Expected standard base64 data')
	}
	const padded = value + '='.repeat((4 - (value.length % 4)) % 4)
	if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(padded)) {
		throw new TypeError('Invalid base64 padding')
	}
	const bytes = new Uint8Array(
		(padded.length / 4) * 3 - (padded.endsWith('==') ? 2 : padded.endsWith('=') ? 1 : 0),
	)
	for (let index = 0, offset = 0; index < padded.length; index += 4) {
		const bits =
			(alphabet.indexOf(padded[index]!) << 18) |
			(alphabet.indexOf(padded[index + 1]!) << 12) |
			(Math.max(0, alphabet.indexOf(padded[index + 2]!)) << 6) |
			Math.max(0, alphabet.indexOf(padded[index + 3]!))
		if (offset < bytes.length) {
			bytes[offset++] = bits >>> 16
		}
		if (offset < bytes.length) {
			bytes[offset++] = bits >>> 8
		}
		if (offset < bytes.length) {
			bytes[offset++] = bits
		}
	}
	if (base64(bytes) !== padded) {
		throw new TypeError('Noncanonical base64 data')
	}
	return bytes
}
export function hex(bytes: Uint8Array): string {
	return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}
export function decodeHex(value: string): Uint8Array<ArrayBuffer> {
	if (!/^(?:[0-9a-fA-F]{2})*$/.test(value)) {
		throw new TypeError('Expected an even number of hexadecimal digits')
	}
	return Uint8Array.from(value.match(/../g) ?? [], (part) => parseInt(part, 16))
}
/** Copy before asynchronous work, preserving the caller's exact view range. */
export function bufferBytes(value: CryptoBufferSource): Uint8Array<ArrayBuffer> {
	if (ArrayBuffer.isView(value)) {
		return new Uint8Array(value.buffer, value.byteOffset, value.byteLength).slice()
	}
	if (Object.prototype.toString.call(value) === '[object ArrayBuffer]') {
		return new Uint8Array(value as ArrayBuffer).slice()
	}
	throw new TypeError('Expected an ArrayBuffer or typed-array view')
}
export function binary(value: BinaryInput): Uint8Array<ArrayBuffer> {
	if (typeof value === 'string') {
		return decodeBase64(value)
	}
	if (
		!(value instanceof Uint8Array) &&
		Object.prototype.toString.call(value) !== '[object ArrayBuffer]'
	) {
		throw new TypeError('Expected base64, Uint8Array or ArrayBuffer')
	}
	return bufferBytes(value)
}
export function join(...values: Uint8Array[]): Uint8Array<ArrayBuffer> {
	const result = new Uint8Array(values.reduce((size, value) => size + value.byteLength, 0))
	let offset = 0
	for (const value of values) {
		result.set(value, offset)
		offset += value.byteLength
	}
	return result
}
/** UTF-8 with replacement of lone surrogates, matching Web TextEncoder. */
export function utf8(value: string): Uint8Array<ArrayBuffer> {
	const bytes: number[] = []
	for (const character of value) {
		let point = character.codePointAt(0)!
		if (point >= 0xd800 && point <= 0xdfff) {
			point = 0xfffd
		}
		if (point < 0x80) {
			bytes.push(point)
		} else if (point < 0x800) {
			bytes.push(0xc0 | (point >>> 6), 0x80 | (point & 63))
		} else if (point < 0x10000) {
			bytes.push(0xe0 | (point >>> 12), 0x80 | ((point >>> 6) & 63), 0x80 | (point & 63))
		} else {
			bytes.push(
				0xf0 | (point >>> 18),
				0x80 | ((point >>> 12) & 63),
				0x80 | ((point >>> 6) & 63),
				0x80 | (point & 63),
			)
		}
	}
	return new Uint8Array(bytes)
}
export function options(value: unknown, keys: string[]): void {
	if (
		!value ||
		typeof value !== 'object' ||
		Array.isArray(value) ||
		Object.keys(value).some((key) => !keys.includes(key))
	) {
		throw new TypeError('Invalid crypto options')
	}
}
export function output(
	bytes: Uint8Array<ArrayBuffer>,
	encoding: 'bytes' | 'base64',
): Uint8Array<ArrayBuffer> | string {
	if (encoding !== 'bytes' && encoding !== 'base64') {
		throw new TypeError('Output encoding must be bytes or base64')
	}
	return encoding === 'base64' ? base64(bytes) : bytes.slice()
}
