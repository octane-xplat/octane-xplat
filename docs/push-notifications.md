# Push notifications

> Receive messages sent to your app with Firebase Cloud Messaging.

A **push notification** is sent from a server, such as an alert that a shared
trip was updated. It needs setup outside your app: a Firebase project and
platform credentials. Build [a working app](toolchain.md#create-and-run)
first, then follow this guide when you're ready to connect those services.

`@octane-xplat/push` is an optional add-on package: it wraps
`@nativescript/firebase-core` + `@nativescript/firebase-messaging` on
iOS/Android and the Firebase JS SDK (`firebase/app` + `firebase/messaging`) on
web. It owns registration, permission, token acquisition and refresh,
foreground messages, and notification tap-through. You own the Firebase
project and the platform credentials — the leaf never sees them on native
and only holds the public web config in the browser.

## Install and platform setup

Add `@octane-xplat/push` to your app. The NativeScript plugins ship as real
dependencies, so `ns prepare` picks them up transitively — no extra plugin
install step.

Every target needs a Firebase project with Cloud Messaging enabled.

**iOS.** Drop `GoogleService-Info.plist` into `App_Resources/iOS/`, enable the
Push Notifications capability (`aps-environment` in your entitlements file)
and the `remote-notification` background mode in `Info.plist`, and upload an
APNs key (or certificate) to the Firebase console. Simulators can register
but never receive messages — verify on a device.

**Android.** Drop `google-services.json` into `App_Resources/Android/` and
apply the `com.google.gms.google-services` Gradle plugin per the
`@nativescript/firebase-core` setup. On Android 13+, notification permission
is a runtime prompt — `requestPermission()` below covers it. The harness
ships a placeholder `google-services.json` so the Gradle plugin parses — it
carries no real Firebase project, so `configure()`/push delivery fail until
you replace it with a real one. If Gradle reports `File google-services.json
is missing` even though the file exists in `App_Resources/Android/`, point
the plugin tasks at that source in `App_Resources/Android/app.gradle`:

```groovy
tasks.matching { it.name.startsWith('process') && it.name.endsWith('GoogleServices') }.configureEach {
  googleServicesJsonFiles.setFrom(file("${getAppResourcesPath()}/Android/google-services.json"))
}
```

The harness includes this configuration so a fresh Android preparation can
build with its placeholder. A successful build does not verify FCM registration
or delivery.

**Web.** Copy the service worker the package ships into your app's static
root:

```sh
cp node_modules/@octane-xplat/push/firebase-messaging-sw.js public/firebase-messaging-sw.js
```

Copy it verbatim — `configure()` passes the Firebase config to the worker
through its registration query string, so the file itself carries no
credentials. Serve it elsewhere via `serviceWorkerUrl` if your app root is
taken.

## Configure once, early

```ts
import { push } from '@octane-xplat/push'

await push.configure({
	// web only — ignored on native, which reads the App_Resources files
	firebaseConfig: { apiKey: '…', projectId: '…', messagingSenderId: '…', appId: '…' },
	vapidKey: '…', // Web Push certificate key — required for getToken on web
})
```

`configure` is idempotent — repeated calls return the same promise. On
native it resolves the already-initialized default Firebase app when the
host called `firebase().initializeApp()` itself. On web, pass `app` instead
of `firebaseConfig` to reuse an app you initialized for other Firebase
features.

## Permission, token, events

```ts
const status = await push.requestPermission() // 'granted' | 'denied' | 'provisional' | …
if (status !== 'granted') {
	/* explain, offer settings */
}

const token = await push.getToken() // FCM registration token
await sendTokenToYourServer(token)

push.onMessage((message) => {
	// foreground: { messageId, title, body, data }
})

push.onNotificationOpen((message) => {
	// user tapped a notification, incl. the cold-start tap that launched the app
})

push.onTokenRefresh((next) => {
	// rotated token — re-register it server-side
})
```

Each `on*` returns an unsubscribe function. Handlers attach cleanly before
or after `configure()` — the leaf queues them, and the native plugin queues
the cold-start tap until a listener exists.

## Behavior by app state

- **Foreground.** iOS/Android deliver to `onMessage` only — the system banner
  is suppressed unless you opt in with `showNotificationsInForeground` in
  `configure`. Web delivers to `onMessage`.
- **Background/quit.** The OS shows notification-payload messages; taps reach
  `onNotificationOpen` on resume or cold start. Web background messages go
  through the service worker: `notification` payloads display via the SDK,
  data-only payloads get a minimal notification shown by the shipped worker.
- **Tap-through on web needs a link.** The FCM worker only reports the click
  when the message carries `fcmOptions.link` or `notification.click_action`
  (same-origin enforced). Set one on every web-targeted message — a bare `/`
  works.
- **Data payloads** arrive on `message.data` as `Record<string, string>` on
  every platform.

## Limits and notes

- `onTokenRefresh` has no web event — the leaf re-reads the token on
  visibility changes and fires when it differs.
- `requestPermission` on Android < 13 resolves `granted`; on iOS the
  requested capabilities can be narrowed via `iosPermissions` in `configure`.
- The APNs registration and `UNUserNotificationCenter` delegate live inside
  `@nativescript/firebase-messaging`, which coexists with
  `@nativescript/local-notifications` (wrapped by `@octane-xplat/platform`).
  If a real delegate conflict surfaces — either plugin silently swallowing
  the other's callbacks — add `@nativescript/shared-notification-delegate`
  between them; don't install it preemptively.
- macOS/Windows are not supported by this leaf.
