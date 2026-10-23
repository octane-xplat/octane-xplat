# Keep a screen awake

> Keep a reading or presentation screen visible while someone is using it.

Use this feature sparingly: keeping the display on uses battery. Start with an
existing Octane Xplat app and a screen that mounts when opened and unmounts when
closed. It prevents automatic screen sleep while permitted by the OS; it cannot
prevent someone from locking their device.

## Own a request with your screen

Call `useKeepAwake()` inside your screen's component in a `.tsx` or `.tsrx` file.
It gives each component an independent tag and releases that tag on unmount.
A retained, hidden component still owns its request: unmount it when its activity
ends. See the [maintained example](../../examples/keep-awake/ReadingScreen.tsrx).

```tsx
import { useKeepAwake } from '@octane-xplat/platform'
import { Text } from '@octane-xplat/ui'

export function ReadingScreen() {
	useKeepAwake()

	return <Text>Your reading screen stays awake while it is open.</Text>
}
```

## Overlapping activities

For work outside a component, activate a named tag and deactivate that same tag
in cleanup. Other tags keep their requests. Tags form a set: activating the same
tag twice does not require two deactivations. Omitting the tag uses
`KeepAwakeDefaultTag`; removing an unknown tag does nothing on supported targets.

```ts
import { keepAwake } from '@octane-xplat/platform'

export async function present(runPresentation: () => Promise<void>) {
	const held = await keepAwake.activate('presentation')
	if (!held) console.log('The screen may sleep')
	try {
		await runPresentation()
	} finally {
		await keepAwake.deactivate('presentation')
	}
}
```

## Availability and release

All four service methods return `Promise<boolean>`. Availability means the
mechanism exists, not that the OS will grant a request. Activation can return
false if a browser denies it; Android accepts requests before an activity exists
and applies them when one starts. `isActivated()` reports a held inhibitor,
not just a requested tag. Web retains failed requests for a later visible-tab
retry, so always deactivate when the activity ends, even after a false result.

```ts
import { keepAwake } from '@octane-xplat/platform'

export async function checkScreenRequest() {
	console.log('Available:', await keepAwake.isAvailable())
	const requested = await keepAwake.activate('reading')
	console.log('Accepted:', requested, 'Held:', await keepAwake.isActivated())
	await keepAwake.deactivate('reading')
}
```

Web may automatically release its lock when the tab hides or the OS changes
power policy. Requested tags retry when the document becomes visible again.
The optional release listener reports the affected tag (including explicit
sentinel release); remove the listener when finished. iOS clears its flag in
background and reapplies requested tags on resume. Android reapplies requests
to newly started activities and clears owned windows on the last deactivation.

```ts
import { keepAwake } from '@octane-xplat/platform'

export async function monitorReading() {
	const stop = keepAwake.onRelease?.((tag) => console.log('Released:', tag))
	await keepAwake.activate('reading')

	return async () => {
		stop?.()
		await keepAwake.deactivate('reading')
	}
}
```

The hook accepts the same optional release callback, plus a setting to suppress
cleanup warnings when deactivation returns false. An explicit tag shares ownership
with anyone using that tag; prefer the generated default for independent screens.

```tsx
import { useKeepAwake } from '@octane-xplat/platform'
import { Text } from '@octane-xplat/ui'

export function PresentationScreen() {
	useKeepAwake(undefined, {
		suppressDeactivateWarnings: true,
		onRelease: (tag) => console.log('Screen lock released:', tag),
	})

	return <Text>Presentation</Text>
}
```

## Target limits and verification

| Target  | Mechanism and limits                                                                                                                                                                                                            |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| iOS     | Application idle timer; foreground only. No added permission.                                                                                                                                                                   |
| Android | `FLAG_KEEP_SCREEN_ON` on activity windows, on the UI thread. No wake-lock permission.                                                                                                                                           |
| Web     | Screen Wake Lock, requiring HTTPS or localhost, a visible document, and permission-policy allowance. Missing API returns false.                                                                                                 |
| macOS   | Foundation activity token preventing idle display sleep while permitting idle system sleep; native AppKit and desktop WKWebView hosts.                                                                                          |
| Linux   | Desktop host uses GTK `IDLE` inhibition; a zero cookie returns false. Session support varies. Without that host capability, tries the browser API if exposed by WebKitGTK. Runtime qualification requires a real Linux session. |
| Windows | Unsupported native leaf; all service methods return false.                                                                                                                                                                      |

This is screen-sleep prevention, not a CPU/background-task wake lock. Linux uses
`IDLE` rather than `SUSPEND` to preserve that boundary. OS policy still takes
precedence. API results and mocked lifecycle tests do not establish physical
sleep prevention. On each intended target, shorten its automatic screen timeout,
open the activity, check the display stays on, then close it and check ordinary
sleep resumes. Also check overlapping activities, background/foreground, and
browser denied requests. Restore your timeout setting afterward.
