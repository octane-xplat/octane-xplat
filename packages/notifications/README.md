# `@octane-xplat/notifications`

Local notifications for Octane Xplat apps — immediate, OS-delivered messages
your app fires itself. For server-delivered (APNs/FCM) push, use
[`@octane-xplat/push`](https://github.com/octane-xplat/octane-xplat/blob/main/packages/push/README.md).

```sh
pnpm add @octane-xplat/notifications
```

```ts
import { notifications } from '@octane-xplat/notifications'

if ((await notifications.requestPermissions()).granted) {
	notifications.notify('Trip saved', 'Your packing list is up to date')
}
```

The shared service contract: `supported`, `isAvailable()`, and the
`getPermissions()`/`requestPermissions()` pair returning
`{status: 'granted' | 'denied' | 'undetermined' | 'unsupported', granted,
canAskAgain}` — get never prompts, request may. `notify(title, body?)`
fires immediately — delayed scheduling and cancellation are deliberately out
of scope. On iOS the underlying plugin schedules a fixed ~2s trigger, so
delivery lags the immediate macOS/web path by a couple of seconds; that is a
plugin limitation the package cannot schedule around.

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

Guide: [Send a local notification](https://octane-xplat.goddardai.org/local-notifications);
[Using device features](https://octane-xplat.goddardai.org/platform-services);
per-target availability: [platform notes](https://github.com/octane-xplat/octane-xplat/blob/main/.agents/docs/notes/platform-notes.md).
