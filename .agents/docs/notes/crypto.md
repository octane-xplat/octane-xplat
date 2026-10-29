# Crypto engines and verification

The leaf follows Expo Crypto 58.0.7's public names and binary/encoding shapes.
The supported AES-GCM subset uses 12-byte nonces and 16-byte tags, including
explicit options and sealed-data parsing. Other sizes reject. AES-128/256 work
across supported hosts; AES-192 is Apple/Android-only, matching Expo's web limit.
SHA-1/256/384/512 are portable. MD5 is native-only for compatibility; MD2/MD4
always report unavailable. See the [public guide](../../../packages/crypto/README.md).

```ts
import { Crypto, AESEncryptionKey, aesEncryptAsync } from '@octane-xplat/crypto'

export async function encryptBytes(bytes: Uint8Array) {
	if (!Crypto.capabilities.aesKeySizes.includes(256)) throw new Error('AES unavailable')
	const key = await AESEncryptionKey.generate()
	return { key, data: await aesEncryptAsync(bytes, key) }
}
```

## Ownership and engines

The existing `platform.random` implementation supplies entropy: browser
`crypto.getRandomValues`, Apple's `SecRandomCopyBytes`, and Android's
`java.security.SecureRandom`. No development fallback exists. Root platform
imports are avoided in runtime code; explicit platform random subpaths keep
Octane hooks and unrelated services out of the crypto import graph.

Browsers use SubtleCrypto. Apple uses a small Objective-C-visible Swift facade
around CryptoKit. iOS and AppKit source copies are identical because their native
source-discovery pipelines consume separate platform directories; the packed
check enforces equality. Android calls MessageDigest and AES/GCM/NoPadding through
NativeScript's Java bridge and needs no extra Java facade or native dependency.
No cryptographic primitive is reimplemented in JavaScript. The shared code owns
validation, UTF-8/base64/hex conversion, snapshots and sealed-data layout.

Inputs are copied before asynchronous work. In particular, raw key import uses
a plain Uint8Array copy rather than calling a subclass's `slice`, since Node's
Buffer.slice aliases its input. Key and sealed-data objects keep private WeakMap
storage; exported bytes are copies. Generated nonces use secure entropy and
caller-supplied nonces require the application's uniqueness guarantee. Combined
bytes are `nonce | ciphertext | tag`, without key ID, AAD or application version.
Only successful engine authentication returns plaintext. Raw keys/plaintext may
exist in managed JS/native memory, and erasure or hardware isolation is not
promised. Whole-input native work and encoding copies can block the caller.

Native GTK and Windows entries currently have no wired cryptographic engine or
secure-random binding, expose the same exports, and explicitly report unavailable.
This is a current integration limit, not an OS cryptography limitation. The
existing platform random source binds only iOS/Android, AppKit or browser engines.
No GTK/Windows runtime claim is made; any future tests must use andromeda.local
or ssh windy respectively. Android runtime is explicitly deferred by the user.

## Evidence

- Four focused shared tests pass against Node Web Crypto. They cover digest/AES
  vectors, strict codecs, Unicode/lone surrogates, offset views and key snapshots,
  randomness quotas/types, malformed options and failure of secure entropy.
- Chromium passes 55 assertions against actual Web Crypto on localhost. This
  includes published GCM examples and four selected NIST CAVS parameter groups
  for AES-128/256, hash vectors, authentication failures and binary ownership.
- The packed consumer passes ambient-free web/native declarations, web/iOS
  production import graphs, identical shipped Apple facades and declared
  Foundation/CryptoKit/Security frameworks.
- A small CryptoKit feasibility task on skymac.local passed an empty NIST AES-128
  vector, SHA-256, AES-192 with authenticated data and tamper rejection.
- iOS Swift language-mode 4/5 API checks pass. An actual NativeScript app on
  skymac.local iOS26.2 passes 62 conformance assertions. A real AppKit JavaScript
  consumer also passes 62 assertions through the CLI-built facade and metadata.
  Both include real Security.framework entropy, MD5 interoperability, AES-192 and
  all six CAVS groups in addition to the browser suite. The macOS consumer imports
  source packages; packed contents are checked separately. No npm-installed
  native app or Android runtime qualification is claimed.

The six committed CAVS records are Count 0 in the IV96/Tag128 groups for
PT0/AAD0 and PT128/AAD128, for each 128/192/256-bit key size. Their exact source
is linked in `tests/cavp-vectors.ts`. Browser tests explicitly reject AES-192;
native qualification runs those extra groups. This is conformance evidence,
not CAVP/FIPS validation. No real user keys or plaintext are used or logged.

The Apple harness copies a task-owned workspace with its root tsconfig; flattening
these packages into /tmp makes their relative tsconfig inheritance invalid.
Dependencies are linked explicitly before either consumer, so Turbo's independent
task order does not determine setup. The AppKit fixture initializes NSApplication
before scheduling its async work; without it the prebuilt host returns from
its run loop before the callback runs. Native builds/devices use the resource
broker, all Apple execution runs on skymac.local, and no screenshots are taken.

## References

- [Expo Crypto](https://docs.expo.dev/versions/latest/sdk/crypto/)
- [Web Crypto](https://www.w3.org/TR/WebCryptoAPI/)
- [Apple CryptoKit](https://developer.apple.com/documentation/cryptokit)
- [Android cryptography](https://developer.android.com/privacy-and-security/cryptography)
- [NIST GCM test vectors](https://csrc.nist.gov/projects/cryptographic-algorithm-validation-program/cavp-testing-block-cipher-modes)
