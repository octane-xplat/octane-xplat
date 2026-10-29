/** Expo-compatible names; MD2/MD4 are exposed for recognition but unavailable. */
export const CryptoDigestAlgorithm = {
	SHA1: 'SHA-1',
	SHA256: 'SHA-256',
	SHA384: 'SHA-384',
	SHA512: 'SHA-512',
	MD2: 'MD2',
	MD4: 'MD4',
	MD5: 'MD5',
} as const
export type CryptoDigestAlgorithm =
	(typeof CryptoDigestAlgorithm)[keyof typeof CryptoDigestAlgorithm]
export const CryptoEncoding = { HEX: 'hex', BASE64: 'base64' } as const
export type CryptoEncoding = (typeof CryptoEncoding)[keyof typeof CryptoEncoding]
export type CryptoDigestOptions = { encoding: CryptoEncoding }
export type Digest = string
export type CryptoBufferSource = ArrayBuffer | ArrayBufferView<ArrayBufferLike>
export type IntegerTypedArray =
	| Int8Array
	| Uint8Array
	| Uint8ClampedArray
	| Int16Array
	| Uint16Array
	| Int32Array
	| Uint32Array
	| BigInt64Array
	| BigUint64Array
/** Strings passed to AES are base64, never plaintext text. */
export type BinaryInput = string | Uint8Array | ArrayBuffer
export const AESKeySize = { AES128: 128, AES192: 192, AES256: 256 } as const
export type AESKeySize = (typeof AESKeySize)[keyof typeof AESKeySize]
/** The portable backend currently supports only 16-byte tags. */
export type GCMTagByteLength = 16 | 15 | 14 | 13 | 12 | 8 | 4
export interface AESSealedDataConfig {
	ivLength: number
	tagLength: GCMTagByteLength
}
export type GCMNonceParam = { length: number } | { bytes: BinaryInput }
export interface AESEncryptOptions {
	nonce?: GCMNonceParam
	tagLength?: GCMTagByteLength
	additionalData?: BinaryInput
}
export interface AESDecryptOptions {
	output?: 'bytes' | 'base64'
	additionalData?: BinaryInput
}
export interface Base64DecryptOptions extends AESDecryptOptions {
	output: 'base64'
}
export interface ArrayBufferDecryptOptions extends AESDecryptOptions {
	output?: 'bytes'
}
export interface CryptoCapabilities {
	random: boolean
	digestAlgorithms: readonly CryptoDigestAlgorithm[]
	aesKeySizes: readonly AESKeySize[]
}
