import {
  AESEncryptionKey,
  AESSealedData,
  aesEncryptAsync,
  aesDecryptAsync,
} from '@octane-xplat/crypto'

/** Persist the returned combined bytes separately from the exported key. */
export async function encryptNote(bytes: Uint8Array) {
  // 1. Generate a key and encrypt the note bytes.
  const key = await AESEncryptionKey.generate()
  const encrypted = await aesEncryptAsync(bytes, key)

  // 2. Return the key and combined ciphertext for separate storage.
  return { key, encrypted: await encrypted.combined() }
}

export async function decryptNote(bytes: Uint8Array, key: AESEncryptionKey) {
  // 3. Reopen the combined ciphertext with the same key.
  return aesDecryptAsync(AESSealedData.fromCombined(bytes), key)
}
