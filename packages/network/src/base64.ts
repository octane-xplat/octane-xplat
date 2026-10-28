const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
export function encode(bytes: Uint8Array): string {
	let result = ''
	for (let i = 0; i < bytes.length; i += 3) {
		const a = bytes[i]!,
			b = bytes[i + 1] ?? 0,
			c = bytes[i + 2] ?? 0

		result += alphabet[a >>> 2]! + alphabet[((a & 3) << 4) | (b >>> 4)]!
		result += i + 1 < bytes.length ? alphabet[((b & 15) << 2) | (c >>> 6)] : '='
		result += i + 2 < bytes.length ? alphabet[c & 63] : '='
	}
	return result
}

export function decode(text: string): Uint8Array {
	if (text.length % 4 || !/^[A-Za-z0-9+/]*={0,2}$/.test(text)) {
		throw new Error('Invalid transport bytes')
	}
	const bytes = new Uint8Array(
		(text.length / 4) * 3 - (text.endsWith('==') ? 2 : text.endsWith('=') ? 1 : 0),
	)
	let at = 0
	for (let i = 0; i < text.length; i += 4) {
		const n =
			(alphabet.indexOf(text[i]!) << 18) |
			(alphabet.indexOf(text[i + 1]!) << 12) |
			(Math.max(0, alphabet.indexOf(text[i + 2]!)) << 6) |
			Math.max(0, alphabet.indexOf(text[i + 3]!))

		if (at < bytes.length) {
			bytes[at++] = n >>> 16
		}

		if (at < bytes.length) {
			bytes[at++] = n >>> 8
		}

		if (at < bytes.length) {
			bytes[at++] = n
		}
	}
	return bytes
}
