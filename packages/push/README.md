# `@octane-xplat/push`

Push notifications for Octane xplat apps over Firebase Cloud Messaging:

- **iOS/Android** — `@nativescript/firebase-core` + `@nativescript/firebase-messaging`
- **Web** — Firebase JS SDK (`firebase/app` + `firebase/messaging`) plus a
  service worker for background delivery

One API on every target:

```ts
import { push } from '@octane-xplat/push';

await push.configure({
  // web only — ignored on native, which reads google-services.json /
  // GoogleService-Info.plist from App_Resources
  firebaseConfig: { apiKey: '…', projectId: '…', messagingSenderId: '…', appId: '…' },
  vapidKey: '…', // web only, required for getToken
});

const permission = await push.requestPermission();
const token = await push.getToken();

push.onMessage((message) => { /* foreground messages */ });
push.onNotificationOpen((message) => { /* taps, incl. cold-start */ });
push.onTokenRefresh((token) => { /* rotated token — re-register server-side */ });
```

Native config files, iOS entitlements, and the web service worker are
app-level setup — see the framework guide
[`docs/push-notifications.md`](../../docs/push-notifications.md).
