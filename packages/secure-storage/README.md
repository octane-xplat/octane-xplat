# `@octane-xplat/secure-storage`

Keychain/Keystore-backed secret storage for Octane xplat apps. iOS writes
to the Keychain and Android to the Keystore via
`@nativescript/secure-storage`; Linux goes through the desktop host bridge
to the Secret Service API (`org.freedesktop.secrets`); web and the macOS
AppKit dev host report `supported: false` — IndexedDB and NSUserDefaults
are not a trust boundary, so the leaf refuses to pretend.

```sh
pnpm add @octane-xplat/secure-storage
```

```ts
import { secureStorage } from '@octane-xplat/secure-storage'

if (secureStorage.supported) {
	const store = secureStorage.impl!
	await store.set('session-token', token)
	const token = await store.get('session-token')
	await store.remove('session-token')
}
```

The shared capability contract: `supported` reports whether an
implementation exists on this target — branch on it rather than catching —
`ensure()` resolves the permission/availability state, and `impl` is an
async string key-value store (`get` / `set` / `remove`).

For non-secret preferences, use `storage` from
[`@octane-xplat/platform`](../platform/README.md) instead.

Guide: [Using device features](../../docs/platform-services.md);
per-target availability: [platform notes](../../docs/platform-notes.md).
