### Hash and encrypt app data

The new crypto package adds Expo-shaped secure random bytes, UUIDs, hashes and
AES-GCM key/sealed-data APIs. Browsers use Web Crypto, Apple uses CryptoKit and
Android uses JCA; Android runtime remains unverified. The portable AES subset
uses fresh 12-byte nonces and 16-byte tags.

```ts
import { AESEncryptionKey, aesEncryptAsync, aesDecryptAsync } from '@octane-xplat/crypto'

export async function encryptAndReopen(bytes: Uint8Array) {
	const key = await AESEncryptionKey.generate()
	const sealed = await aesEncryptAsync(bytes, key)
	return aesDecryptAsync(sealed, key)
}
```

[Crypto setup, key ownership and platform limits](https://github.com/octane-xplat/octane-xplat/blob/main/packages/crypto/README.md)
