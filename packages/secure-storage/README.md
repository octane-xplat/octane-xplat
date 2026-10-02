# `@octane-xplat/secure-storage`

```sh
pnpm add @octane-xplat/secure-storage
```

Keychain/Keystore-backed secret storage for Octane xplat apps. iOS writes
to the Keychain and Android to the Keystore via
`@nativescript/secure-storage`; Linux goes through the desktop host bridge
to the Secret Service API (`org.freedesktop.secrets`); web and the macOS
AppKit dev host report `supported: false` — IndexedDB and NSUserDefaults
are not a trust boundary, so the leaf refuses to pretend.

```ts
import { secureStorage } from '@octane-xplat/secure-storage'

// Call with a token issued by your app's backend; never log its value.
async function saveSession(token: string) {
	if ((await secureStorage.ensure()) !== 'granted') return
	const store = secureStorage.impl!
	await store.set('session-token', token)
	return await store.get('session-token')
}
```

The shared capability contract: `supported` reports whether an
implementation exists on this target — branch on it rather than catching —
`ensure()` resolves the permission/availability state, and `impl` is an
async string key-value store (`get` / `set` / `remove`).

```ts
if ((await secureStorage.ensure()) === 'granted') {
	await secureStorage.impl!.remove('session-token')
}
```

For non-secret preferences, use `storage` from
[`@octane-xplat/platform`](../platform/README.md) instead.

Guide: [Using device features](../../docs/platform-services.md);
per-target availability: [platform notes](../../docs/platform-notes.md).
