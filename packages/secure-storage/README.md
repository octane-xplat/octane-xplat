# `@octane-xplat/secure-storage`

```sh
pnpm add @octane-xplat/secure-storage
```

Store session tokens without displaying their contents. iOS and macOS use
Keychain, Android uses the Keystore-backed plugin, and Linux uses the desktop
host's Secret Service adapter. Plain browsers report `supported: false`.

```ts
import { secureStorage } from '@octane-xplat/secure-storage'

// Call with a token issued by your app's backend; never log its value.
async function saveSession(token: string) {
	if ((await secureStorage.ensure()) !== 'granted' || !secureStorage.impl) return null
	const store = secureStorage.impl
	if (!await store.set('session-token', token)) return null
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

Guide: [Using device features](../../docs/platform/platform-services.md);
per-target availability: [platform notes](../../docs/notes/platform-notes.md).

## macOS AppKit

Install the leaf as an app runtime dependency. Use the CLI-owned
`pnpm xplat dev --targets macos` or `pnpm xplat build --targets macos` workflow;
it compiles the bundled Foundation/Security sources and loads their metadata
before your JavaScript. See [native prerequisites](../../docs/platform/macos-native.md#prepare-the-app).
No new UI dependency, host adapter, or runtime permission request is needed.
A custom host without the native leaf reports unsupported.

Keychain generic-password items use a service namespace owned by this leaf.
Packaged apps are scoped by bundle identifier; keep that identifier stable
across releases. CLI development hosts are scoped by the app's working directory.
Moving that directory changes the development namespace, and development entries
are separate from packaged entries. Items stay on this Mac and do not use iCloud
synchronization. `remove()` deletes only the named item in that namespace.

`ensure()` reports that the native implementation exists; it does not unlock the
Keychain or guarantee the next operation succeeds. No authentication prompt is
opened by the leaf. A missing key returns `null`; a failed read rejects with
`Keychain read failed`, without keys, values, or native exception text. Writing the
same key overwrites its value, and empty strings are preserved. Writes
return `false` when Keychain access fails. Removal returns `true` for an already
missing key and `false` for access failures. Handle these results in your sign-in
flow rather than falling back to preferences or browser storage.

From the repository root, `pnpm --filter @octane-xplat/secure-storage test:macos`
checks the adapter and sanitized failures. `test:packed` checks package types;
`test:macos-runtime` compiles a packed leaf and exercises real Keychain operations
in an isolated host, including persistence across launches, bundle identity isolation,
and a Vite build of its public import. That fixture creates
random payloads in memory, prints only status markers, and removes its test items.
It does not test UI input or locked-Keychain/signing policies.
