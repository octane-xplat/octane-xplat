# @octane-xplat/firebase-analytics

Send screen and product events to Firebase Analytics from web, iOS, and
Android. Native apps use the NativeScript Firebase plugin; web uses Firebase's
JavaScript SDK. macOS and Windows report unsupported.

## Send a test event

Install in an existing Xplat app:

```sh
bun add @octane-xplat/firebase-analytics
```

Register the app in Firebase first. Native setup needs the matching
`GoogleService-Info.plist` on iOS or `google-services.json` on Android;
web needs the Firebase project's public configuration object. Complete the
[NativeScript Firebase setup](https://firebase.nativescript.org/) before
using the native SDK.

Call this during your test flow. Pass the web configuration in a browser;
native uses its configured app files:

```ts
import { firebaseAnalytics } from '@octane-xplat/firebase-analytics'

export async function sendTestEvent(webConfig?: Record<string, unknown>) {
	if (!firebaseAnalytics.supported) return
	await firebaseAnalytics.init(webConfig)
	await firebaseAnalytics.logScreenView('packing_list')
	await firebaseAnalytics.logEvent('item_packed', { item_kind: 'example' })
}
```

Verify the event in the configured Firebase project's debugging/event tools.
Check SDK setup and collection settings if no event arrives. Avoid sending
personal contents as event properties. The
[public contract](https://github.com/octane-xplat/octane-xplat/blob/main/packages/firebase-analytics/src/types.ts)
lists additional event and collection controls.
