// Unpadded base64url (RFC 4648 §5) — the encoding PKCE and hosted-auth
// wire formats use. `btoa` is not declared on every target's typecheck,
// so encode by hand.

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'

export function bytesToBase64Url(bytes: Uint8Array): string {
	let out = ''
	for (let i = 0; i < bytes.length; i += 3) {
		const a = bytes[i]
		const b = i + 1 < bytes.length ? bytes[i + 1] : 0
		const c = i + 2 < bytes.length ? bytes[i + 2] : 0
		out += ALPHABET[a >> 2]
		out += ALPHABET[((a & 0x03) << 4) | (b >> 4)]
		if (i + 1 < bytes.length) {
			out += ALPHABET[((b & 0x0f) << 2) | (c >> 6)]
		}

		if (i + 2 < bytes.length) {
			out += ALPHABET[c & 0x3f]
		}
	}

	return out
}
