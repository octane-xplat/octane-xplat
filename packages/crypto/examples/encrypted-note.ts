import {
	AESEncryptionKey,
	AESSealedData,
	aesEncryptAsync,
	aesDecryptAsync,
} from '@octane-xplat/crypto'
/** Persist the returned combined bytes separately from the exported key. */
export async function encryptNote(bytes: Uint8Array) {
	const key = await AESEncryptionKey.generate()
	const encrypted = await aesEncryptAsync(bytes, key)
	return { key, encrypted: await encrypted.combined() }
}
export async function decryptNote(bytes: Uint8Array, key: AESEncryptionKey) {
	return aesDecryptAsync(AESSealedData.fromCombined(bytes), key)
}
