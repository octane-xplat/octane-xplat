# Hash and encrypt app-owned bytes

ID: crypto
Targets: web, ios, android, macos
Related APIs: @octane-xplat/crypto, digest, digestStringAsync, getRandomBytes, getRandomBytesAsync, getRandomValues, randomUUID, AESEncryptionKey, AESSealedData, aesEncryptAsync, aesDecryptAsync

## Starting point

An existing Xplat app with binary data to encrypt, or text/bytes to checksum.
The app owns persistent key storage, ciphertext storage and protocol context.

## Requirements

- Install/rebuild native code and identify available operations and algorithms.
- Use secure entropy and preserve exact byte ranges and encodings.
- Encrypt with fresh nonces, authenticate context, and reject tampered data.
- Preserve key/sealed-data snapshots and interoperable serialization.
- Distinguish source checks from actual runtime qualification and explain memory/key ownership.

## Acceptance criteria

- AC1: A reader can install the leaf, check per-operation capabilities, hash UTF-8 text or an offset buffer view, choose hex/base64 output, and handle unsupported legacy algorithms and hosts.
- AC2: A reader can generate secure bytes or a UUID, fill integer views without overwriting adjacent bytes, respect length/type quotas and fail closed when entropy fails.
- AC3: A reader can generate/import a supported AES key, encrypt/decrypt binary data with fresh nonces and optional authenticated context, reject modified ciphertext/tag/context or a wrong key, and identify the portable nonce/tag subset.
- AC4: A reader can serialize combined or separate sealed components, preserve independent byte/key snapshots, export/import key encodings and persist the key separately using supported secure storage.
- AC5: A reader can identify engine/platform restrictions, browser secure-context requirements, memory/thread costs, exportable-key limitations and actual runtime evidence without claiming hardware isolation or a streaming API.

## Documentation

- AC1: [Checksum and installation](../../../packages/crypto/README.md#make-a-document-checksum) and [capabilities](../../../packages/crypto/README.md#choose-supported-hosts-and-key-sizes).
- AC2: [Secure random values](../../../packages/crypto/README.md#generate-random-values).
- AC3: [Authenticated encryption](../../../packages/crypto/README.md#encrypt-and-reopen-binary-data) and [maintained actions](../../../packages/crypto/examples/encrypted-note.ts).
- AC4: [Serialization and separate key storage](../../../packages/crypto/README.md#store-ciphertext-and-its-key-separately).
- AC5: [Engine scope and costs](../../../packages/crypto/README.md#choose-supported-hosts-and-key-sizes) and [verification record](../notes/crypto.md).
