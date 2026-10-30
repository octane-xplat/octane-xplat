# Randomness and tracking consent

Use for OS randomness and advertising consent/identifier boundaries. Availability is explicit; consult the [service index](../services.md) for other capabilities.

## `random` — OS CSPRNG

`random.bytes(length)` returns a `Uint8Array` of secure random bytes;
`random.fill(view)` fills any `ArrayBufferView` in place. Web uses
`crypto.getRandomValues`, iOS/macOS `SecRandomCopyBytes`, Android
`java.security.SecureRandom`. Windows has a WinRT `CryptographicBuffer` leaf;
check `random.supported` for binding availability. A standalone x64 NativeScript
DLL check passed, including a large offset byte view; app-host integration
requires separate target qualification. No weaker fallback exists.

```ts
import { random } from '@octane-xplat/platform'

const nonce = random.bytes(16)
```

## Tracking consent and advertising identifiers

Use the [tracking authorization guide](../../../../../packages/tracking-transparency/README.md)
for Expo-shaped permission methods and an Octane hook. Request only from an
explicit foreground app action after configuring the iOS purpose string; never
request in startup effects. Read status without prompting, preserve denied and
restricted states, and complete the app's own consent flow before starting ads
or analytics. A no-ATT-gate grant does not represent app consent.

```ts
import { getTrackingPermissionsAsync, requestTrackingPermissionsAsync } from '@octane-xplat/tracking-transparency'

const permission = await getTrackingPermissionsAsync()
export async function requestFromButton() {
	return requestTrackingPermissionsAsync()
}
```

Use asynchronous identifier access in shared code: Android's Google client
cannot run on NativeScript's JS/UI thread. Never log or persist identifiers.
Native macOS/GTK/web return null; Windows requires its WinRT projection and
has not qualified live NativeScript ID access. Android compilation/runtime
and real ATT choices/device IDs require separate target qualification.

```ts
import { getAdvertisingIdAsync } from '@octane-xplat/tracking-transparency'

export async function withFreshIdentifier(consume: (id: string) => Promise<void>) {
	const id = await getAdvertisingIdAsync()
	if (id !== null) await consume(id)
}
```
