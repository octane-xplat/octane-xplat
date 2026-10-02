# Send a local notification

> Ask for permission, then let the operating system show a message from your app.

A **local notification** is a message created on the device. It does not need a
server. This guide uses `@octane-xplat/notifications` on web, iOS, Android, and
the experimental native macOS AppKit target. For messages sent by a server,
use the separate [push guide](push-notifications.md).

## Install and send

In your app directory, install the leaf package:

```sh
pnpm add @octane-xplat/notifications
```

Call this function from a button's press handler. Asking after a press gives
the person context for the permission prompt:

```ts
import { notifications } from '@octane-xplat/notifications'

export async function sendReminder() {
	const result = await notifications.ensure()
	if (result === 'granted') {
		notifications.impl?.notify('Reminder', 'Your break starts now.')
	}
	return result
}
```

`ensure()` returns `granted`, `denied`, or `unsupported`. Show a useful message
for the last two outcomes. If permission was denied, explain how to enable
notifications in system or browser settings; repeatedly asking cannot override
the person's choice. After importing this leaf, the shared
`permissions.ensure('notifications')` dispatcher uses the same permission owner.
The dispatcher reports `unsupported` when no owner is installed.

`notify(title, body?)` returns `void`; a missing body becomes an empty message.
It does not request permission or confirm delivery. The public leaf currently
provides immediate notifications only: it has no delayed schedule, cancellation,
receipt, tap callback, or push registration API. Mobile plugin APIs remain
app-level APIs rather than additional methods on this leaf.

## Native macOS setup and behavior

Use the [AppKit app setup](../start/toolchain.md#experimental-appkit-target) on an Apple
Silicon Mac with Xcode selected. Keep this leaf in the app's runtime
`dependencies`, then run these commands from the app directory:

```sh
pnpm xplat doctor
pnpm xplat build --targets macos
```

The CLI compiles the package's Objective-C source, links Apple's
UserNotifications framework, and adds the leaf's declarations to the native
metadata. No host edits or push entitlements are required. See
[native leaves](macos-native.md) if compilation or metadata generation fails.
Run the resulting `.app` from the configured output directory to test permission
and delivery under its bundle identity. A plain Node process without native
metadata, or an unbundled host without an app bundle identity, reports `supported: false`, `unsupported`, and `impl: null`.

The macOS implementation asks for alert, sound, and badge permission. Native
permission errors return `denied`. Permission callbacks return to the JS main
thread. Each send reads the current OS authorization state, so revoking
permission prevents later submissions. Authorized and provisionally authorized
states submit an immediate request with a unique ID; other states submit
nothing. Submission errors are logged as numeric codes without message content.

This leaf preserves the application's notification-center delegate. It does
not install foreground banner or click handling. The OS and any app-owned
delegate decide presentation; a foreground app may receive no visible banner.
Focus settings and notification preferences can also suppress presentation.
Check Notification Center as well as banner behavior when testing your app.

## Verification boundary

The maintained [AppKit fixture](../../packages/notifications/tests/verify-macos.mjs)
compiles and loads the native leaf, checks metadata selectors, constructs a real
immediate request, and tests permission/error/thread and submission behavior
with an intercepted notification center. The
[small runnable handler](../../packages/notifications/tests/send-reminder.ts)
shows the example used above. Packed consumer checks cover macOS Bundler and
NodeNext declaration resolution, plus the existing web/mobile typing lanes.

These checks do not request real permission or post notifications. Real OS
permission prompts, persistence across relaunch, revoked permissions, and
Notification Center delivery still require a packaged app in an interactive
macOS session. Build success and intercepted handler dispatch are separate
from that evidence.
