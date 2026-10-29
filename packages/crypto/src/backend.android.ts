import type { CryptoBackend } from './backend-types'
/** JCA engines stay in this platform leaf; no new native plugin is required. */
function javaBytes(bytes: Uint8Array) {
	const result = Array.create('byte', bytes.length)
	for (let index = 0; index < bytes.length; index++) {
		result[index] = bytes[index]!
	}
	return result
}
function bytes(value: ArrayLike<number>): Uint8Array<ArrayBuffer> {
	const result = new Uint8Array(value.length)
	for (let index = 0; index < value.length; index++) {
		result[index] = value[index]!
	}
	return result
}
const ready = () => typeof java !== 'undefined' && typeof javax !== 'undefined'
export const backend: CryptoBackend = {
	capabilities: () =>
		ready()
			? {
					digestAlgorithms: ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512', 'MD5'],
					aesKeySizes: [128, 192, 256],
				}
			: { digestAlgorithms: [], aesKeySizes: [] },
	async digest(algorithm, data) {
		return bytes(java.security.MessageDigest.getInstance(algorithm).digest(javaBytes(data)))
	},
	async crypt(decrypt, data, key, iv, aad) {
		const cipher = javax.crypto.Cipher.getInstance('AES/GCM/NoPadding')
		cipher.init(
			decrypt ? javax.crypto.Cipher.DECRYPT_MODE : javax.crypto.Cipher.ENCRYPT_MODE,
			new javax.crypto.spec.SecretKeySpec(javaBytes(key), 'AES'),
			new javax.crypto.spec.GCMParameterSpec(128, javaBytes(iv)),
		)
		if (aad.length) {
			cipher.updateAAD(javaBytes(aad))
		}
		return bytes(cipher.doFinal(javaBytes(data)))
	},
}
