# `@octane-xplat/notifications`

Local notifications for Octane xplat apps. iOS and Android run
`@nativescript/local-notifications`; web uses the Notification API; Linux
delivers through the desktop host bridge (org.freedesktop.Notifications on
the session bus) and reports unsupported without a host; the macOS AppKit
dev host reports `supported: false`.

```sh
pnpm add @octane-xplat/notifications
```

```ts
import { notifications } from '@octane-xplat/notifications'

if ((await notifications.ensure()) === 'granted') {
	notifications.impl!.notify('Trip saved', 'Your packing list is up to date')
}
```

The shared capability contract: `supported`, `ensure()` →
`'granted' | 'denied' | 'unsupported'`, then `impl`. `notify(title, body?)`
fires immediately — scheduling and push delivery (APNs/FCM) are
deliberately out of scope; remote push lives in
[`@octane-xplat/push`](../push/README.md).

Guide: [Using device features](../../docs/platform-services.md);
per-target availability: [platform notes](../../docs/platform-notes.md).
