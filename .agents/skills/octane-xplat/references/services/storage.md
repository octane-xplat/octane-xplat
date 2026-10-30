# Storage and credentials

Use for key/value state, secure-storage failures, SQLite transactions, and Windows credentials. Check the [service index](../services.md) for capability and package-selection rules.

## `storage` — key/value

`packages/platform/src/storage.ts` → `ApplicationSettings`;
`storage.web.ts` → `localStorage`; `storage.macos.ts` → AppKit host hooks
(`NSUserDefaults` in the stock host). Import through `@octane-xplat/platform`.
Use it for nonsecret preferences and drafts. For session tokens, follow
[secure storage](../../../../../docs/platform/platform-services.md#store-a-session-token);
never fall back to ordinary storage.

```ts
import { storage } from '@octane-xplat/platform'

// Windows flush() cannot confirm a blocking durable commit and returns false.
storage.setString('bag', 'Carry-on')
const bag = storage.getString('bag')
```

AppKit retains missing-hook mutations as pending session intent; a native miss
never resurrects an acknowledged memory value. Pre-host writes can move to the
installed host, but previous-host state stays isolated. Reads never replay writes.
Flush returns false with undelivered mutations; synchronous native hooks
can confirm handoff without an explicit flush hook. Callers must handle false or
throw, and must not infer crash durability or native qualification. Inactive
subscriptions retire before cleanup on host/hook replacement and retry failed
registration. See [AppKit settings](../../../../../docs/platform/platform-services.md#appkit-settings).

```ts
import { storage } from '@octane-xplat/platform'

export function saveDraft(text: string): boolean {
	try { storage.setString('draft', text); return storage.flush() }
	catch { return false }
}
```

AppKit `platformQueryStorage` is a separate best-effort cache policy: only a
complete get/set/remove bridge persists data, partial bridges use isolated memory,
and explicit purge surfaces native read/removal failure or an incomplete/lost
bridge. Restore catches read errors and falls through to the loader. Never
replace the bridge during account purge. Do not copy fallback cache into a newly
installed native store. The source and authored models do not prove
restart, native lifecycle, input, AX or installed consumers.

```ts
import type { QueryClient } from '@octane-xplat/ui/data'

// Pass the existing account client that owns persistent definitions.
export async function purgeAccount(account: QueryClient): Promise<boolean> {
	try { await account.dispose({ purgePersisted: true }); return true }
	catch { return false }
}
```

## AppKit secure-storage bridge and read failures

Keep session tokens in secureStorage, never ordinary storage. AppKit supported/
isAvailable validate a complete callable get/set/remove bridge; they do not
unlock Keychain or authorize the next operation. Capture the global binding and
all methods once per operation with their native receiver. Absent/incomplete/
throwing lookup rejects asynchronously with UnavailabilityError, without native
payloads. Only item-not-found returns null; missing/malformed dictionaries,
invalid status/value or native errors reject with fixed Keychain read failed.
Read dictionary status once, skip values on failure and require a native true
for write/remove success. Preserve empty strings and existing native namespace/
no-prompt/update policy. Never infer OS qualification from these source guards.

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

Six new VM/model cases (nine total) are UNRUN. The maintained Services example
catches cleanup rejection and prints only status. Native ObjC code is unchanged;
real class/method/dictionary/BOOL bridging, Keychain persistence/access, signing/
sandbox/locked-policy behavior and installed consumers require separate target qualification. JS
try/catch cannot contain a native process abort; the CLI must load leaf metadata
first. See [session workflow](../../../../../docs/platform/platform-services.md#store-a-session-token)
and [AppKit contract](../../../../../packages/secure-storage/README.md#macos-appkit).

## SQLite transactions

Choose settings, secure credentials or structured data by ownership. The guide
includes a maintained packing-list migration/CRUD screen and strict transient
refusal; database writes do not automatically update UI readers. Subscribe with
`useStore`, reload rows after writes, and never claim success before completion.

Use the callback's handle for every awaited transaction operation. Main-handle
calls queue until it ends; awaiting them inside the callback would deadlock.
The callback handle expires afterward and rejects nesting and close. See the
[local storage guide](../../../../../docs/app/local-storage.md).

```ts
await db.transaction(async (tx) => {
	await tx.execute('INSERT INTO items(name) VALUES (?)', ['Passport'])
})
```

## Windows secure credentials

The experimental native [secure-storage leaf](../../../../../packages/secure-storage/README.md#experimental-native-windows)
uses PasswordVault and requires package identity. Package family scopes resource
names; this is not a security barrier from other desktop apps. Credential Locker
may roam entries under Windows/account policy. No plaintext or mobile fallback
is allowed. Missing keys return null; other reads reject with a sanitized error;
writes/removals return false on failure. Empty strings are encoded internally.

```ts
import { secureStorage } from '@octane-xplat/secure-storage'

async function saveToken(token: string) {
  if (!secureStorage.supported || !(await secureStorage.isAvailable())) return false
  return secureStorage.set('session-token', token)
}
```

Standalone x64 vault operations passed using task namespaces, with all created
entries removed and confirmed missing. Real packaged identity, cross-launch
persistence, roaming/access policies and full app integration require separate target qualification.
The alpha.144 projection exposes missing-item HRESULT 0x80070490 only as a
message suffix; preserve that distinction and never return null for every native
exception or forward native error text. This does not enable Windows hosted auth.

For hashes or encryption, use the [crypto guide](../../../../../packages/crypto/README.md).
Mirror its current Expo-shaped API; strings passed to AES are base64, while
string digests use UTF-8. Default AES uses a fresh 12-byte secure nonce and a
16-byte tag. Never reuse a caller-supplied nonce with a key. Persist keys through
supported secure storage separately from ciphertext; exportable key objects
are not hardware-backed handles. Use per-operation capabilities. Android runtime
remains unverified; native GTK/Windows backends are unavailable.

```ts
import { AESEncryptionKey, aesEncryptAsync } from '@octane-xplat/crypto'

export async function encryptPayload(bytes: Uint8Array) {
 const key = await AESEncryptionKey.generate()
 const sealed = await aesEncryptAsync(bytes, key)
 return { key, bytes: await sealed.combined() }
}
```
