// Minimal base64 codec usable on every JS host (no atob/Buffer dependency).
const TABLE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
const REV = new Map([...TABLE].map((c, i) => [c, i]))

export function decodeBase64(src: string): Uint8Array {
	const out = new Uint8Array(Math.ceil(src.length / 4) * 3)
	let o = 0
	for (let i = 0; i < src.length; i += 4) {
		const a = REV.get(src[i]) ?? 0
		const b = REV.get(src[i + 1]) ?? 0
		const c = src[i + 2] === '=' ? -1 : (REV.get(src[i + 2]) ?? 0)
		const d = src[i + 3] === '=' ? -1 : (REV.get(src[i + 3]) ?? 0)
		const n = (a << 18) | (b << 12) | ((c < 0 ? 0 : c) << 6) | (d < 0 ? 0 : d)

		out[o++] = (n >> 16) & 255
		if (c >= 0) {
			out[o++] = (n >> 8) & 255
		}

		if (d >= 0) {
			out[o++] = n & 255
		}
	}

	return out.subarray(0, o)
}

export function encodeBase64(data: Uint8Array): string {
	let out = ''
	for (let i = 0; i < data.length; i += 3) {
		const n = (data[i] << 16) | ((data[i + 1] ?? 0) << 8) | (data[i + 2] ?? 0)
		out += TABLE[(n >> 18) & 63] + TABLE[(n >> 12) & 63]
		out += i + 1 < data.length ? TABLE[(n >> 6) & 63] : '='
		out += i + 2 < data.length ? TABLE[n & 63] : '='
	}

	return out
}

/** Normalize `font.data` (bytes or base64) to bytes. */
export function fontBytes(data: Uint8Array | ArrayBuffer | string): Uint8Array {
	if (typeof data === 'string') {
		return decodeBase64(data)
	}

	if (data instanceof Uint8Array) {
		return data
	}

	return new Uint8Array(data)
}
