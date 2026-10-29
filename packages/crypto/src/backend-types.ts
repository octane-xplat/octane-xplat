import type { AESKeySize, CryptoDigestAlgorithm } from './types'
export interface CryptoBackend {
	capabilities(): {
		digestAlgorithms: readonly CryptoDigestAlgorithm[]
		aesKeySizes: readonly AESKeySize[]
	}
	digest(
		algorithm: CryptoDigestAlgorithm,
		data: Uint8Array<ArrayBuffer>,
	): Promise<Uint8Array<ArrayBuffer>>
	crypt(
		decrypt: boolean,
		data: Uint8Array<ArrayBuffer>,
		key: Uint8Array<ArrayBuffer>,
		iv: Uint8Array<ArrayBuffer>,
		aad: Uint8Array<ArrayBuffer>,
	): Promise<Uint8Array<ArrayBuffer>>
}
