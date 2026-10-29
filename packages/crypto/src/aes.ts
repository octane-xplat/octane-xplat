import { UnavailabilityError } from '@octane-xplat/lib/capability'
import { backend } from './backend'
import { getRandomBytes } from './service'
import { base64, binary, decodeBase64, decodeHex, hex, join, options, output } from './bytes'
import type {
	AESKeySize,
	AESSealedDataConfig,
	BinaryInput,
	GCMTagByteLength,
	AESEncryptOptions,
	AESDecryptOptions,
	ArrayBufferDecryptOptions,
	Base64DecryptOptions,
} from './types'
const keys = new WeakMap<AESEncryptionKey, Uint8Array<ArrayBuffer>>()
type Parts = {
	iv: Uint8Array<ArrayBuffer>
	ciphertext: Uint8Array<ArrayBuffer>
	tag: Uint8Array<ArrayBuffer>
}
const sealed = new WeakMap<AESSealedData, Parts>()
function keyBytes(key: AESEncryptionKey): Uint8Array<ArrayBuffer> {
	const value = keys.get(key)
	if (!value) {
		throw new TypeError('Expected an AESEncryptionKey')
	}
	return value.slice()
}
function size(value: number): asserts value is AESKeySize {
	if (value !== 128 && value !== 192 && value !== 256) {
		throw new RangeError('AES key size must be 128, 192 or 256 bits')
	}
	if (!backend.capabilities().aesKeySizes.includes(value)) {
		throw new UnavailabilityError(`Crypto AES-${value} on this host`)
	}
}
function tagLength(value: number): asserts value is 16 {
	if (value !== 16) {
		throw new UnavailabilityError('Crypto portable AES-GCM requires a 16-byte tag')
	}
}
function ivLength(value: number): void {
	if (value !== 12) {
		throw new UnavailabilityError('Crypto portable AES-GCM requires a 12-byte nonce')
	}
}
/** Exportable in-memory key; this is not a hardware-backed keystore handle. */
export class AESEncryptionKey {
	private constructor(bytes: Uint8Array<ArrayBuffer>) {
		keys.set(this, bytes.slice())
	}
	get size(): AESKeySize {
		return (keyBytes(this).length * 8) as AESKeySize
	}
	static async generate(bits: AESKeySize = 256): Promise<AESEncryptionKey> {
		size(bits)
		return new AESEncryptionKey(getRandomBytes(bits / 8))
	}
	static import(bytes: Uint8Array): Promise<AESEncryptionKey>
	static import(encoded: string, encoding: 'hex' | 'base64'): Promise<AESEncryptionKey>
	static async import(
		value: string | Uint8Array,
		encoding?: 'hex' | 'base64',
	): Promise<AESEncryptionKey> {
		let bytes: Uint8Array<ArrayBuffer>
		if (typeof value === 'string') {
			if (encoding !== 'hex' && encoding !== 'base64') {
				throw new TypeError('Key encoding must be hex or base64')
			}
			bytes = encoding === 'hex' ? decodeHex(value) : decodeBase64(value)
		} else {
			if (encoding !== undefined || !(value instanceof Uint8Array)) {
				throw new TypeError('Expected key bytes or an encoded key string')
			}
			bytes = binary(value)
		}
		size(bytes.length * 8)
		return new AESEncryptionKey(bytes)
	}
	async bytes(): Promise<Uint8Array<ArrayBuffer>> {
		return keyBytes(this)
	}
	async encoded(encoding: 'hex' | 'base64'): Promise<string> {
		if (encoding !== 'hex' && encoding !== 'base64') {
			throw new TypeError('Key encoding must be hex or base64')
		}
		return encoding === 'hex' ? hex(keyBytes(this)) : base64(keyBytes(this))
	}
}
function parts(value: AESSealedData): Parts {
	const result = sealed.get(value)
	if (!result) {
		throw new TypeError('Expected AESSealedData')
	}
	return result
}
/** Portable byte layout is nonce (12) + ciphertext + authentication tag (16). */
export class AESSealedData {
	private constructor(
		iv: Uint8Array<ArrayBuffer>,
		ciphertext: Uint8Array<ArrayBuffer>,
		tag: Uint8Array<ArrayBuffer>,
	) {
		ivLength(iv.length)
		tagLength(tag.length)
		sealed.set(this, { iv: iv.slice(), ciphertext: ciphertext.slice(), tag: tag.slice() })
	}
	static fromCombined(
		value: BinaryInput,
		config: AESSealedDataConfig = { ivLength: 12, tagLength: 16 },
	): AESSealedData {
		options(config, ['ivLength', 'tagLength'])
		ivLength(config.ivLength)
		tagLength(config.tagLength)
		const bytes = binary(value)
		if (bytes.length < 28) {
			throw new RangeError('Combined AES-GCM data must contain a nonce and authentication tag')
		}
		return new AESSealedData(bytes.slice(0, 12), bytes.slice(12, -16), bytes.slice(-16))
	}
	static fromParts(iv: BinaryInput, ciphertext: BinaryInput, tag: BinaryInput): AESSealedData
	static fromParts(
		iv: BinaryInput,
		ciphertextWithTag: BinaryInput,
		tagLength?: number,
	): AESSealedData
	static fromParts(
		iv: BinaryInput,
		ciphertext: BinaryInput,
		tag: BinaryInput | number = 16,
	): AESSealedData {
		const nonce = binary(iv),
			bytes = binary(ciphertext)
		if (typeof tag !== 'number') {
			return new AESSealedData(nonce, bytes, binary(tag))
		}
		tagLength(tag)
		if (bytes.length < tag) {
			throw new RangeError('Ciphertext does not contain a complete authentication tag')
		}
		return new AESSealedData(nonce, bytes.slice(0, -tag), bytes.slice(-tag))
	}
	get combinedSize(): number {
		const value = parts(this)
		return value.iv.length + value.ciphertext.length + value.tag.length
	}
	get ivSize(): number {
		return parts(this).iv.length
	}
	get tagSize(): GCMTagByteLength {
		return 16
	}
	iv(encoding?: 'bytes'): Promise<Uint8Array<ArrayBuffer>>
	iv(encoding: 'base64'): Promise<string>
	iv(encoding?: 'bytes' | 'base64'): Promise<Uint8Array<ArrayBuffer> | string>
	async iv(encoding: 'bytes' | 'base64' = 'bytes'): Promise<Uint8Array<ArrayBuffer> | string> {
		return output(parts(this).iv, encoding)
	}
	tag(encoding?: 'bytes'): Promise<Uint8Array<ArrayBuffer>>
	tag(encoding: 'base64'): Promise<string>
	tag(encoding?: 'bytes' | 'base64'): Promise<Uint8Array<ArrayBuffer> | string>
	async tag(encoding: 'bytes' | 'base64' = 'bytes'): Promise<Uint8Array<ArrayBuffer> | string> {
		return output(parts(this).tag, encoding)
	}
	combined(encoding?: 'bytes'): Promise<Uint8Array<ArrayBuffer>>
	combined(encoding: 'base64'): Promise<string>
	combined(encoding?: 'bytes' | 'base64'): Promise<Uint8Array<ArrayBuffer> | string>
	async combined(
		encoding: 'bytes' | 'base64' = 'bytes',
	): Promise<Uint8Array<ArrayBuffer> | string> {
		const value = parts(this)
		return output(join(value.iv, value.ciphertext, value.tag), encoding)
	}
	ciphertext(value: { includeTag?: boolean; encoding: 'base64' }): Promise<string>
	ciphertext(value?: { includeTag?: boolean; encoding?: 'bytes' }): Promise<Uint8Array<ArrayBuffer>>
	ciphertext(value: {
		includeTag?: boolean
		encoding?: 'bytes' | 'base64'
	}): Promise<Uint8Array<ArrayBuffer> | string>
	async ciphertext(
		value: { includeTag?: boolean; encoding?: 'bytes' | 'base64' } = {},
	): Promise<Uint8Array<ArrayBuffer> | string> {
		options(value, ['includeTag', 'encoding'])
		if (value.includeTag !== undefined && typeof value.includeTag !== 'boolean') {
			throw new TypeError('includeTag must be boolean')
		}
		const data = parts(this)
		return output(
			value.includeTag ? join(data.ciphertext, data.tag) : data.ciphertext,
			value.encoding ?? 'bytes',
		)
	}
}
/** Encrypt binary data; string input must be base64. Leave nonce unset for fresh secure bytes. */
export async function aesEncryptAsync(
	plaintext: BinaryInput,
	key: AESEncryptionKey,
	value: AESEncryptOptions = {},
): Promise<AESSealedData> {
	options(value, ['nonce', 'tagLength', 'additionalData'])
	tagLength(value.tagLength ?? 16)
	let iv: Uint8Array<ArrayBuffer>
	if (value.nonce === undefined) {
		iv = getRandomBytes(12)
	} else {
		options(value.nonce, ['length', 'bytes'])
		if ('length' in value.nonce) {
			if ('bytes' in value.nonce) {
				throw new TypeError('Choose nonce bytes or nonce length')
			}
			ivLength(value.nonce.length)
			iv = getRandomBytes(12)
		} else if ('bytes' in value.nonce) {
			iv = binary(value.nonce.bytes)
		} else {
			throw new TypeError('Expected nonce bytes or nonce length')
		}
	}
	ivLength(iv.length)
	const bytes = binary(plaintext),
		material = keyBytes(key),
		aad = value.additionalData === undefined ? new Uint8Array() : binary(value.additionalData)
	size(material.length * 8)
	try {
		const ciphertext = await backend.crypt(false, bytes, material, iv, aad)
		return AESSealedData.fromParts(iv, ciphertext)
	} finally {
		material.fill(0)
	}
}
export function aesDecryptAsync(
	data: AESSealedData,
	key: AESEncryptionKey,
	value: Base64DecryptOptions,
): Promise<string>
export function aesDecryptAsync(
	data: AESSealedData,
	key: AESEncryptionKey,
	value?: ArrayBufferDecryptOptions,
): Promise<Uint8Array<ArrayBuffer>>
export function aesDecryptAsync(
	data: AESSealedData,
	key: AESEncryptionKey,
	value?: AESDecryptOptions,
): Promise<string | Uint8Array<ArrayBuffer>>
/** Authentication failures reject without returning any plaintext. */
export async function aesDecryptAsync(
	data: AESSealedData,
	key: AESEncryptionKey,
	value: AESDecryptOptions = {},
): Promise<string | Uint8Array<ArrayBuffer>> {
	options(value, ['output', 'additionalData'])
	if (value.output !== undefined && value.output !== 'bytes' && value.output !== 'base64') {
		throw new TypeError('Output encoding must be bytes or base64')
	}
	const source = parts(data),
		material = keyBytes(key),
		aad = value.additionalData === undefined ? new Uint8Array() : binary(value.additionalData)
	size(material.length * 8)
	try {
		return output(
			await backend.crypt(
				true,
				join(source.ciphertext, source.tag),
				material,
				source.iv.slice(),
				aad,
			),
			value.output ?? 'bytes',
		)
	} catch {
		throw Object.assign(new Error('AES-GCM authentication or decryption failed'), {
			code: 'ERR_CRYPTO_DECRYPT',
		})
	} finally {
		material.fill(0)
	}
}
