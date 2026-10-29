import { UnavailabilityError } from '@octane-xplat/lib/capability'
import type { CryptoBackend } from './backend-types'
import { base64, decodeBase64 } from './bytes'
interface Engine {
	perform(request: string): string
}
const engine = () => (globalThis as unknown as { XplatCryptoEngine?: Engine }).XplatCryptoEngine
function invoke(value: Record<string, string>): Uint8Array<ArrayBuffer> {
	const host = engine()
	if (!host) {
		throw new UnavailabilityError('Crypto native Apple bridge; rebuild after installing')
	}
	const result = JSON.parse(host.perform(JSON.stringify(value))) as { ok?: boolean; data?: string }
	if (result.ok !== true || typeof result.data !== 'string') {
		throw new Error('Native cryptographic operation failed')
	}
	return decodeBase64(result.data)
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
