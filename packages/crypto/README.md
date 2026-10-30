# Hash and encrypt app data

Use `@octane-xplat/crypto` for secure random bytes, UUIDs, hashes and authenticated
AES encryption. Function names, constants, key objects and sealed-data objects
follow Expo Crypto 58.0.7. The initial AES subset uses a 12-byte nonce and a
16-byte authentication tag on every supported host.

```sh
bun add @octane-xplat/crypto
```

Start in an existing Xplat app. Rebuild iOS and AppKit apps after installation to
include the CryptoKit facade; refreshing JavaScript cannot add native code.
AppKit uses the [CLI native-library workflow](../../docs/platform/macos-native.md).
Android uses built-in JCA engines and remains runtime-unverified.

## Make a document checksum

Put this action in `src/checksum.ts`. Calling it returns a lowercase SHA-256
checksum for the supplied text. A checksum identifies bytes; it does not encrypt
them or authenticate who sent them. String input is encoded as UTF-8, including
replacement of unmatched UTF-16 surrogates.

```ts
import { CryptoDigestAlgorithm, digestStringAsync } from '@octane-xplat/crypto'

export function checksum(text: string) {
	return digestStringAsync(CryptoDigestAlgorithm.SHA256, text)
}
// await checksum('abc') starts with 'ba7816bf'.
```

Use `digest` for binary input. It reads only the supplied view's byte range and
copies it before asynchronous work, so later caller edits do not change the job.
`CryptoEncoding.BASE64` returns standard, padded base64 without line breaks.

```ts
import { digest, digestStringAsync, CryptoEncoding } from '@octane-xplat/crypto'

export async function binaryChecksum(bytes: Uint8Array) {
	return new Uint8Array(await digest('SHA-256', bytes))
}
export function encodedChecksum(text: string) {
	return digestStringAsync('SHA-256', text, { encoding: CryptoEncoding.BASE64 })
}
```

SHA-1, SHA-256, SHA-384 and SHA-512 are available in browsers and on Apple/Android.
Native Apple/Android also expose MD5 for legacy interoperability. Prefer SHA-256
or stronger for new checksums; SHA-1 and MD5 are unsuitable for collision-resistant
security decisions. MD2 and MD4 constants remain recognizable but operations
reject as unavailable. No password hashing or key derivation API is included.

```ts
import { Crypto } from '@octane-xplat/crypto'

export function canHashReports() {
	return Crypto.capabilities.digestAlgorithms.includes('SHA-256')
}
```

## Encrypt and reopen binary data

AES-GCM encrypts bytes and adds an authentication tag that detects edits. The
key is a separate secret. Keep the same key to reopen the encrypted data; losing
it loses access to that data. The first action below returns an in-memory key
and encrypted bytes so the caller can immediately demonstrate a round trip.

```ts
import {
	AESEncryptionKey,
	AESSealedData,
	aesEncryptAsync,
	aesDecryptAsync,
} from '@octane-xplat/crypto'

export async function tryEncryption(bytes: Uint8Array) {
	const key = await AESEncryptionKey.generate() // 256 bits by default
	const sealed = await aesEncryptAsync(bytes, key)
	const savedBytes = await sealed.combined()
	const restored = AESSealedData.fromCombined(savedBytes)
	const reopened = await aesDecryptAsync(restored, key)
	return { savedBytes, reopened }
}
```

The maintained [encrypted-note actions](examples/encrypted-note.ts) accept
`Uint8Array` input. AES also accepts an `ArrayBuffer` or a standard base64 string.
A string means encoded binary data, not text. Decryption returns bytes by default;
`output: 'base64'` returns a padded base64 string. Malformed encodings reject.

```ts
import { AESEncryptionKey, aesEncryptAsync, aesDecryptAsync } from '@octane-xplat/crypto'

export async function encryptEncodedBytes(key: AESEncryptionKey) {
	const sealed = await aesEncryptAsync('AAECAw==', key) // bytes 0, 1, 2, 3
	return aesDecryptAsync(sealed, key, { output: 'base64' })
}
```

Generate a fresh nonce for every encryption with the same key: leaving `nonce`
unset does this using the existing platform secure-random service. Explicit
nonce bytes are for a protocol that already guarantees uniqueness. Reusing a
nonce with the same key breaks AES-GCM's security. Nondefault nonce/tag lengths
reject rather than being ignored or shortened.

```ts
import { AESEncryptionKey, aesEncryptAsync } from '@octane-xplat/crypto'

export function encryptWithFreshNonce(bytes: Uint8Array, key: AESEncryptionKey) {
	return aesEncryptAsync(bytes, key) // fresh 12-byte nonce, 16-byte tag
}
```

Optional additional authenticated data binds context to the ciphertext without
encrypting that context. Supply identical bytes when decrypting. A wrong key,
edited ciphertext/tag or different context rejects with `ERR_CRYPTO_DECRYPT`;
no unauthenticated plaintext is returned.

```ts
import { AESEncryptionKey, aesEncryptAsync, aesDecryptAsync } from '@octane-xplat/crypto'

export async function encryptForRecord(
	bytes: Uint8Array,
	recordId: Uint8Array,
	key: AESEncryptionKey,
) {
	const sealed = await aesEncryptAsync(bytes, key, { additionalData: recordId })
	return aesDecryptAsync(sealed, key, { additionalData: recordId })
}
```

## Store ciphertext and its key separately

`AESEncryptionKey` is an exportable in-memory key, not a Keychain/Keystore handle.
`bytes()` and `encoded('hex' | 'base64')` return copies. Import accepts raw key
bytes or encoded key data, validates its size, and snapshots it. These APIs do
not derive a key from a password. Use the existing [secure-storage
setup](../secure-storage/README.md) for a native app's persistent key, and keep
ciphertext in ordinary app data. Do not put the key alongside that ciphertext.

```ts
import { AESEncryptionKey } from '@octane-xplat/crypto'
import { secureStorage } from '@octane-xplat/secure-storage'

export async function saveNativeKey(key: AESEncryptionKey) {
	if (!secureStorage.supported) throw new Error('Secure key storage is unavailable')
	if (!(await secureStorage.set('notes-aes-key', await key.encoded('hex')))) {
		throw new Error('Could not persist the encryption key')
	}
}
export async function loadNativeKey() {
	const encoded = await secureStorage.get('notes-aes-key')
	return encoded === null ? null : AESEncryptionKey.import(encoded, 'hex')
}
```

The combined layout is `nonce | ciphertext | tag`: the first 12 bytes are the
nonce and the last 16 bytes are the tag. This matches the default Expo AES-GCM
layout. The format does not include key identity, application version or
additional authenticated data; save those separately when your protocol needs
them. Parsing sealed data does not authenticate it; successful decryption does.

```ts
import { AESSealedData } from '@octane-xplat/crypto'

export async function inspectEncryptedBytes(bytes: Uint8Array) {
	const sealed = AESSealedData.fromCombined(bytes)
	return { nonceBytes: sealed.ivSize, tagBytes: sealed.tagSize, totalBytes: sealed.combinedSize }
}
```

For protocols that store components separately, `iv()`, `ciphertext()` and `tag()`
return copies in bytes or base64. `ciphertext({ includeTag: true })` appends the
tag. `fromParts` accepts either three separate components or a nonce plus
ciphertext-with-tag. These operations preserve the owner's stored bytes.

```ts
import { AESSealedData } from '@octane-xplat/crypto'

export async function separateAndRestore(data: AESSealedData) {
	return AESSealedData.fromParts(await data.iv(), await data.ciphertext(), await data.tag())
}
```

## Generate random values

`getRandomBytes` and its async counterpart accept integer lengths from 0 through 1024. `getRandomValues` fills an existing integer typed array, preserves bytes
outside an offset view, returns that same view, and allows at most 65,536 bytes.
Floating-point arrays and DataView reject. UUIDs use random version-4 bits. Every
method fails if secure entropy is missing or fails; development builds never
fall back to `Math.random`.

```ts
import {
	getRandomBytes,
	getRandomBytesAsync,
	getRandomValues,
	randomUUID,
} from '@octane-xplat/crypto'

export async function randomExample() {
	const bytes = getRandomBytes(32)
	const moreBytes = await getRandomBytesAsync(32)
	const words = getRandomValues(new Uint32Array(8))
	return { bytes, moreBytes, words, id: randomUUID() }
}
```

## Choose supported hosts and key sizes

Check the individual capability rather than assuming one supported operation
implies all others. Browser hashing/AES requires Web Crypto on HTTPS or trusted
localhost. AES-128 and AES-256 are portable; AES-192 is implemented only on
Apple/Android, matching Expo's web limitation. The nonce/tag subset is 12/16
bytes everywhere, including explicit values and sealed-data parsing.

```ts
import { Crypto, AESKeySize } from '@octane-xplat/crypto'

export function canEncryptNotes() {
	return Crypto.capabilities.random && Crypto.capabilities.aesKeySizes.includes(AESKeySize.AES256)
}
```

| Host                 | Engines and qualification                                                                                                                                         |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Browser              | Web Crypto and platform.random; 55 Chromium conformance assertions plus four shared tests pass.                                                                   |
| iOS                  | CryptoKit and platform.random's Security.framework source; 62 iOS 26.2 conformance assertions pass on skymac.local.                                               |
| macOS AppKit         | Experimental CryptoKit facade and Security.framework entropy; 62 assertions pass through a CLI-built JavaScript consumer on skymac.local.                         |
| Android              | MessageDigest, AES/GCM/NoPadding and platform.random's SecureRandom; source typechecked, runtime explicitly unverified.                                           |
| Native GTK / Windows | No crypto engine or secure-random backend wired into these entries; matching exports import safely and report unavailable. Browser-hosted apps use the web entry. |

Hashing/encryption processes a whole input in memory. Apple and Android engine
calls and byte/base64 copies can run on the calling thread despite returning a
Promise; this is not a streaming or background-worker API. Large values can
stall interaction and create multiple copies. Raw keys and plaintext can exist
in JavaScript/native managed memory; the package cannot guarantee erasure or
hardware isolation. Store only ciphertext in logs, databases and handoff files
where plaintext is not intended to persist.

```ts
import { Crypto } from '@octane-xplat/crypto'

export function encryptionSupport() {
	return Crypto.capabilities
}
```

[Implementation evidence](../../.agents/docs/notes/crypto.md) records the exact
checks and limits. References: [Expo Crypto](https://docs.expo.dev/versions/latest/sdk/crypto/),
[Web Crypto](https://www.w3.org/TR/WebCryptoAPI/),
[Apple CryptoKit](https://developer.apple.com/documentation/cryptokit) and
[Android cryptography](https://developer.android.com/privacy-and-security/cryptography).
