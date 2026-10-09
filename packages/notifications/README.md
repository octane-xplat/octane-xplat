# `@octane-xplat/notifications`

Local notifications for Octane Xplat apps — immediate, OS-delivered messages
your app fires itself. For server-delivered (APNs/FCM) push, use
[`@octane-xplat/push`](../push/README.md).

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
fires immediately — delayed scheduling and cancellation are deliberately out
of scope.

## Platform support

- **iOS/Android** — `@nativescript/local-notifications`
- **Web** — the Notification API
- **macOS (AppKit)** — Apple UserNotifications through the leaf's compiled
  Objective-C source
- **Linux** — the desktop host bridge (org.freedesktop.Notifications on the
  session bus); reports unsupported without a host

Notifications require a packaged app bundle identity. Install the package as a
runtime dependency and use `xplat dev` or `xplat build` so the CLI loads its
metadata; without the identity or the metadata, the leaf reports
`supported: false`.

Guide: [Send a local notification](../../docs/platform/local-notifications.md);
[Using device features](../../docs/platform/platform-services.md);
per-target availability: [platform notes](../../docs/notes/platform-notes.md).
