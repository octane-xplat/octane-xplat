# `@octane-xplat/secure-storage`

Store session tokens without displaying their contents. iOS and macOS use
Keychain, Android uses the Keystore-backed plugin, and Linux uses the desktop
host's Secret Service adapter. Plain browsers report `supported: false`.

```sh
pnpm add @octane-xplat/secure-storage
```

```ts
import { secureStorage } from '@octane-xplat/secure-storage'

// Call with a token issued by your app's backend; never log its value.
async function saveSession(token: string) {
	if (!secureStorage.supported || !(await secureStorage.isAvailable())) return null
	try {
		if (!(await secureStorage.set('session-token', token))) return null
		return await secureStorage.get('session-token')
	} catch { return null }
}
```

The shared service contract: `supported` reports whether a backing store
exists on this target — branch on it rather than catching — `isAvailable()`
probes the host, and the object itself is an async string key-value store
(`get` / `set` / `remove`). Calling a method while unsupported rejects with
`UnavailabilityError`.

```ts
if (secureStorage.supported) {
	await secureStorage.remove('session-token')
}
```

For non-secret preferences, use `storage` from
[`@octane-xplat/platform`](https://github.com/octane-xplat/octane-xplat/blob/main/packages/platform/README.md) instead.

Guide: [Using device features](https://octane-xplat.goddardai.org/platform-services);
per-target availability: [platform notes](https://github.com/octane-xplat/octane-xplat/blob/main/.agents/docs/notes/platform-notes.md).

## macOS AppKit

Install the leaf as an app runtime dependency. Use the CLI-owned
`pnpm xplat dev macos` or `pnpm xplat build --targets macos` workflow;
it compiles the bundled Foundation/Security sources and loads their metadata
before your JavaScript. See [native prerequisites](https://octane-xplat.goddardai.org/macos-native#prepare-the-app).
No new UI dependency, host adapter, or runtime permission request is needed.
A custom host without the complete callable get/set/remove bridge reports unsupported.

```sh
pnpm add @octane-xplat/secure-storage
pnpm xplat dev macos
```

Keychain generic-password items use this leaf's service namespace. Packaged apps
are scoped by bundle identifier; keep that identifier stable across releases.
Development entries are scoped to the app's working directory and separate from
packaged entries. Moving the directory changes that development namespace. Items
stay on this Mac and do not use iCloud synchronization.

Availability checks confirm a complete callable bridge, not an unlocked Keychain
or permission to read an item. Operations capture one binding, so a later
availability check cannot guarantee success. An absent, incomplete or throwing
binding rejects operations with UnavailabilityError. Handle failures without
logging keys, values or native errors, and keep a missing item distinct from a
failed read:

```ts
import { secureStorage } from '@octane-xplat/secure-storage'

type Session = { status: 'restored'; token: string } | { status: 'missing' | 'unavailable' }
export async function restoreSession(): Promise<Session> {
	if (!secureStorage.supported || !(await secureStorage.isAvailable())) return { status: 'unavailable' }
	try {
		const token = await secureStorage.get('session-token')
		return token === null ? { status: 'missing' } : { status: 'restored', token }
	} catch { return { status: 'unavailable' } }
}
```

Only the native item-not-found status returns null. Missing/malformed native
responses and access failures reject with `Keychain read failed`; empty strings
are preserved. Writes and removals require a native true result to report success,
and return false for native failures. Removal succeeds for an already missing
item and deletes only the named item in the current namespace. No authentication
prompt opens. Use these results rather than a plaintext fallback:

```ts
import { secureStorage } from '@octane-xplat/secure-storage'

export async function saveSession(token: string): Promise<boolean> {
	if (!secureStorage.supported || !(await secureStorage.isAvailable())) return false
	try { return await secureStorage.set('session-token', token) }
	catch { return false }
}
export async function forgetSession(): Promise<boolean> {
	if (!secureStorage.supported || !(await secureStorage.isAvailable())) return false
	try { return await secureStorage.remove('session-token') }
	catch { return false }
}
```

Repository verification commands below exercise different boundaries. The adapter
suite models bridge failures; the packed suite checks package types. The runtime
fixture compiles an isolated native host, creates random in-memory payloads,
prints status markers and removes its items. It is intended to check persistence
across launches and bundle identity isolation, plus a Vite public-import build.
It does not test UI input or locked-Keychain/signing policies.

```sh
pnpm exec turbo run test:macos --filter=@octane-xplat/secure-storage
pnpm exec turbo run test:packed --filter=@octane-xplat/secure-storage
pnpm exec turbo run test:macos-runtime --filter=@octane-xplat/secure-storage
```

The six newly authored bridge cases (nine total) remain UNRUN for the current
AppKit task. Only source/syntax checks ran; native class/method/dictionary/BOOL
bridging, Keychain access, host replacement, signing/sandbox and installed
consumers remain unqualified. A JavaScript exception guard cannot contain a
native process abort; the CLI's leaf-loading prerequisite still applies.
