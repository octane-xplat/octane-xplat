# `@octane-xplat/notifications`

Local notifications for Octane Xplat apps — immediate, OS-delivered messages
your app fires itself. For server-delivered (APNs/FCM) push, use
[`@octane-xplat/push`](https://github.com/octane-xplat/octane-xplat/blob/main/packages/push/README.md).

```sh
bun add @octane-xplat/notifications
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
canAskAgain}` — the contract is that get never prompts and request may.
The hosted macOS webview bridge still uses an authorization request for reads;
avoid probing through that backend until its separate bridge is corrected. `notify(title, body?)`
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



## AppKit permission reads

Rebuild the native host after updating this package: AppKit now requires separate
read and request selectors. Missing, stale or incomplete metadata and unbundled
hosts report unsupported; reads never fall back to requesting authorization.
A not-yet-decided status is `undetermined` with `canAskAgain: true`; denied is
false. Authorized and provisional states map to granted, which does not prove
banner presentation.

```ts
import { notifications } from '@octane-xplat/notifications'
import { permissions } from '@octane-xplat/platform'

const direct = await notifications.getPermissions()
const shared = await permissions.getPermissions('notifications')
// Neither read requests authorization on native AppKit.
```

Explicit requests read back the OS authorization state. A request error alone
does not establish denial. This change applies to native AppKit; the hosted
webview backend still has its separate ensure-only bridge.

Eight JS contract cases and native intercepted-center/metadata callback checks
are authored but unrun for this change. Compilation, actual bridge callbacks,
OS prompts, relaunch/revocation, delivery and signing remain unqualified.
