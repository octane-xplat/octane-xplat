# Tracking authorization

Read iOS tracking authorization, request it from a button, and use advertising
identifiers when available. `@octane-xplat/tracking-transparency` follows Expo's
permission methods and hook tuple, with explicit platform subsets.

## Request from an app action

Start with a running Octane Xplat app. Install the package in its directory,
complete the native setup below, and rebuild the native app. A JavaScript-only
refresh cannot install the bridge or change native permission configuration.

```sh
pnpm add @octane-xplat/tracking-transparency
```

In your iOS app's `App_Resources/iOS/Info.plist`, add a purpose string describing
what your app does with tracking data. Replace the example with your app's
actual explanation before rebuilding. The package rejects missing or blank
configuration when requesting; reading permission does not require a prompt.

```xml
<key>NSUserTrackingUsageDescription</key>
<string>Allow this app to measure advertising results across apps and websites.</string>
```

Call this function from an existing button's tap/click handler, and display its
returned text. On iOS 14+, the OS may show its tracking choice if the app is
active and authorization is still undetermined. A denial or restriction stays
visible in the result. Configuration or activity failures reject the promise,
so show the error through your screen's normal error handling.

```ts
import { requestTrackingPermissionsAsync } from '@octane-xplat/tracking-transparency'

export async function requestTrackingFromButton(): Promise<string> {
	const permission = await requestTrackingPermissionsAsync()
	return `Tracking authorization: ${permission.authorizationStatus}`
}
```

The request does not wait in the background for a future opportunity to prompt.
An inactive app must retry through a new foreground action. Another system
permission dialog can also prevent ATT from showing; an undetermined result
means the OS has not made a decision. Concurrent calls share one native request.

```ts
import { getTrackingPermissionsAsync } from '@octane-xplat/tracking-transparency'

const permission = await getTrackingPermissionsAsync() // No prompt.
if (permission.status === 'undetermined') {
	// Offer your button; do not request from a startup effect.
}
```

## Read permission in an Octane component

The hook returns `[permission, request, refresh]`. Its default mount behavior
only reads permission. Call `request` from an app action; `refresh` reads again,
for example after returning from system settings. An unmounted reader ignores
late results without canceling another caller's OS request.

```tsx
import { useState } from 'octane'
import { Button, Text, VStack } from '@octane-xplat/ui'
import { useTrackingPermissions, type PermissionResponse } from '@octane-xplat/tracking-transparency'

export function TrackingChoice() {
	const [permission, request, refresh] = useTrackingPermissions()
	const [error, setError] = useState('')
	function run(action: () => Promise<PermissionResponse>) {
		setError('')
		void action().catch(error => setError(String(error)))
	}
	return (
		<VStack>
			<Text>{error}</Text>
			<Text>{permission?.authorizationStatus ?? 'Reading permission…'}</Text>
			<Button label="Request tracking choice" clickAction={() => run(request)} />
			<Button label="Refresh permission" clickAction={() => run(refresh)} />
		</VStack>
	)
}
```

Use `{ get: false }` to disable the default read. The returned methods are still
usable immediately after the component commits. Automatic `{ request: true }`
is outside the supported subset and rejects; prompts always need an explicit
action. The [maintained actions](examples/tracking-actions.ts) show non-UI helpers.

```tsx
const [permission, request, refresh] = useTrackingPermissions({ get: false })
```

Permission responses keep Expo's `status`, `granted`, `canAskAgain`, and
`expires` fields. The added `authorizationStatus` preserves Apple's distinction
between `restricted` and `denied`; both map to portable `status: 'denied'`.
`canAskAgain: false` means this API will not show another choice for that state.
This subset does not implement newer regional annual re-prompt flows.

```ts
import { getTrackingPermissionsAsync } from '@octane-xplat/tracking-transparency'

const permission = await getTrackingPermissionsAsync()
if (permission.authorizationStatus === 'restricted') {
	// The OS restriction cannot be changed through another request here.
}
```

## Advertising identifiers

Prefer `getAdvertisingIdAsync()` in shared code. It reads through AdSupport on
iOS, through Google's identifier service on an Android worker thread, and
through Windows AdvertisingManager when its WinRT type is projected by the host. The
framework does not retain completed results. A null result means no usable
identifier was returned, including opt-out and all-zero values. Never log or
persist an advertising identifier.

```ts
import { getAdvertisingIdAsync } from '@octane-xplat/tracking-transparency'

export async function useAdvertisingIdentifier(consume: (identifier: string) => Promise<void>) {
	const identifier = await getAdvertisingIdAsync()
	if (identifier !== null) await consume(identifier)
}
```

The familiar synchronous `getAdvertisingId()` is available on iOS and supported Windows hosts. Android
uses NativeScript's shared JS/UI thread, while Google's synchronous client
forbids that thread; this getter explicitly throws there. Use the async method
instead. The iOS simulator returns null, and iOS 14+ requires authorization.
Older iOS uses its legacy advertising-tracking preference.

```ts
import { getAdvertisingIdAsync } from '@octane-xplat/tracking-transparency'

const identifier = await getAdvertisingIdAsync() // Shared asynchronous shape.
```

Android installation adds `com.google.android.gms.permission.AD_ID` through
manifest merging and links the small Play-services identifier dependency.
It does not install the full ads SDK or show an iOS-style permission dialog.
If a custom manifest removes that permission, restore it and rebuild before
reading IDs on apps targeting Android 13+. Google Play services failures reject.

```xml
<uses-permission android:name="com.google.android.gms.permission.AD_ID" />
```

## Platforms and qualification

`isAvailable()` reports whether the selected backend has a native tracking
capability. Check `capabilities.prompt` specifically for an ATT prompt and
`advertisingIdAsync` for asynchronous identifier access. These are separate
capabilities: Android can read an identifier without implementing ATT.

```ts
import { isAvailable, TrackingTransparency } from '@octane-xplat/tracking-transparency'

const nativeCapability = isAvailable()
const canOfferATTPrompt = TrackingTransparency.capabilities.prompt
const canReadIdentifier = TrackingTransparency.capabilities.advertisingIdAsync
```

On Android, web and desktop, permission methods follow Expo's no-ATT-gate
convention: `granted` with `authorizationStatus: 'unavailable'`. That result
describes the absence of this OS gate; it does not record the person's consent
for your app's ads or analytics. Finish your own consent flow before starting
SDKs configured for tracking.

```ts
import { getTrackingPermissionsAsync } from '@octane-xplat/tracking-transparency'

const permission = await getTrackingPermissionsAsync()
if (permission.authorizationStatus === 'unavailable') {
	// Continue your app's own consent flow; no ATT dialog exists here.
}
```

Native macOS, GTK and browsers expose no advertising identifier through
this package. Windows returns null when the OS advertising ID is disabled;
its identifier is alphanumeric rather than an Apple/Google UUID. Apple's macOS ATT header explicitly documents an always-
undetermined result; the leaf does not pretend that supplies a working prompt.
On iOS below 14, ATT is unavailable and permission methods return the same
no-gate result. A missing iOS bridge is a rebuild error, rather than a grant.

```ts
import { TrackingTransparency } from '@octane-xplat/tracking-transparency'

if (!TrackingTransparency.capabilities.advertisingIdAsync) {
	// Keep the feature usable without a native advertising identifier.
}
```

Twelve unit/component/compiler tests, source checks, and seven-target packed
declarations pass. Swift 4/5 API checks and a built iOS simulator app with 28
permission-read and request-guard assertions pass on `skymac.local`. The native
harness uses an older Octane runtime and does not qualify the current native
hook or an installed consumer. Eleven synthetic Windows adapter assertions
and a real WinRT type lookup pass through `ssh windy`; no host ID was read.
Android application compilation and runtime are deferred. Successful ATT
choices, physical-device identifier retrieval, live Windows NativeScript ID
access and signed installed consumers remain unqualified.
See the [Expo reference](https://docs.expo.dev/versions/latest/sdk/tracking-transparency/)
and [Google's main-thread restriction](https://developers.google.com/android/reference/com/google/android/gms/ads/identifier/AdvertisingIdClient).
