import { UnavailabilityError, lookupGlobal } from '@octane-xplat/lib/capability'
import type { CryptoBackend } from './backend-types'
import { base64, decodeBase64 } from './bytes'
interface Engine {
	perform(request: string): string
}

const engine = () => lookupGlobal(['XplatCryptoEngine']) as Engine | undefined
function invoke(value: Record<string, string>): Uint8Array<ArrayBuffer> {
	const host = engine()
	if (!host) {
		throw new UnavailabilityError('Crypto native Apple bridge; rebuild after installing')
	}
	// The bridge replies with a JSON envelope; bound it at this ingress.
	const reply: unknown = JSON.parse(host.perform(JSON.stringify(value)))
	const result = typeof reply === 'object' && reply !== null ? reply : undefined
	const ok = result !== undefined && 'ok' in result && result.ok === true
	const data = ok && 'data' in result && typeof result.data === 'string' ? result.data : undefined
	if (data === undefined) {
		throw new Error('Native cryptographic operation failed')
	}
	return decodeBase64(data)
}

export const backend: CryptoBackend = {
	capabilities: () =>
		engine()
			? {
					digestAlgorithms: ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512', 'MD5'],
					aesKeySizes: [128, 192, 256],
				}
			: { digestAlgorithms: [], aesKeySizes: [] },
	async digest(algorithm, data) {
		return invoke({ operation: 'digest', algorithm, data: base64(data) })
	},
	async crypt(decrypt, data, key, iv, aad) {
		return invoke({
			operation: decrypt ? 'decrypt' : 'encrypt',
			data: base64(data),
			key: base64(key),
			iv: base64(iv),
			aad: base64(aad),
		})
	},
}
