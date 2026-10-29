import { UnavailabilityError } from '@octane-xplat/lib/capability'
import type { CryptoBackend } from './backend-types'
const subtle = () => (typeof crypto !== 'undefined' ? crypto.subtle : undefined)
function required() {
	const value = subtle()
	if (!value) {
		throw new UnavailabilityError('Web Crypto; use HTTPS or a trusted localhost origin')
	}
	return value
}
export const backend: CryptoBackend = {
	capabilities: () =>
		subtle()
			? { digestAlgorithms: ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'], aesKeySizes: [128, 256] }
			: { digestAlgorithms: [], aesKeySizes: [] },
	async digest(algorithm, data) {
		return new Uint8Array(await required().digest(algorithm, data))
	},
	async crypt(decrypt, data, keyBytes, iv, aad) {
		const engine = required()
		const key = await engine.importKey('raw', keyBytes, 'AES-GCM', false, [
			decrypt ? 'decrypt' : 'encrypt',
		])
		const options = { name: 'AES-GCM', iv, additionalData: aad, tagLength: 128 }
		return new Uint8Array(
			await (decrypt ? engine.decrypt(options, key, data) : engine.encrypt(options, key, data)),
		)
	},
}
