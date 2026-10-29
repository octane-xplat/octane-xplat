# Screen orientation

Choose a landscape or portrait policy for a phone screen, read its interface
orientation, and stop listening when the screen closes. This package follows
Expo's orientation constants and method shapes. It reads the app's painted
interface, rather than the physical device sensor.

## Add orientation controls to an app

Start with a working Octane Xplat browser or NativeScript phone app. Install
the package in that app's directory. Phone apps need NativeScript core 9.1.3
or later. Complete [iOS configuration](#configure-ios) before trying a lock
on an iPhone or iPad.

```sh
pnpm add @octane-xplat/screen-orientation
```

Call this function from an existing button's tap/click handler and display its
returned text in your app. A supported landscape request changes the phone's
interface orientation; a refusal returns a message the app can show.

```ts
import {
	OrientationLock,
	getOrientationAsync,
	lockAsync,
	supportsOrientationLockAsync,
} from '@octane-xplat/screen-orientation'

export async function useWideLayout(): Promise<string> {
	if (!(await supportsOrientationLockAsync(OrientationLock.LANDSCAPE))) {
		return 'Landscape locking is unavailable in this window.'
	}
	try {
		await lockAsync(OrientationLock.LANDSCAPE)
		return `Current interface orientation: ${await getOrientationAsync()}`
	} catch (error) {
		return `Keep the flexible layout: ${String(error)}`
	}
}
```

## Configure iOS

Runtime locking needs iOS 16 or later and a scene-backed NativeScript app.
In `App_Resources/iOS/Info.plist`, declare the orientations your app supports.
The package rejects requests outside that list. This fragment permits upright
portrait and both landscapes on iPhone:

```xml
<key>UISupportedInterfaceOrientations</key>
<array>
  <string>UIInterfaceOrientationPortrait</string>
  <string>UIInterfaceOrientationLandscapeLeft</string>
  <string>UIInterfaceOrientationLandscapeRight</string>
</array>
```

For iPad, also set `UIRequiresFullScreen` to `true` and configure
`UISupportedInterfaceOrientations~ipad` in that plist. Resizable windows and
multitasking can still prevent locking on newer OS versions. Build adaptive
layouts and handle rejection; a support query is not an OS guarantee.

```xml
<key>UIRequiresFullScreen</key>
<true/>
<key>UISupportedInterfaceOrientations~ipad</key>
<array>
  <string>UIInterfaceOrientationPortrait</string>
  <string>UIInterfaceOrientationLandscapeLeft</string>
  <string>UIInterfaceOrientationLandscapeRight</string>
</array>
```

UIKit must ask your app delegate for the current policy. For an app without
a custom delegate, create `src/orientation-delegate.ios.ts` with the following
code. If your app already has a delegate, add this method to its existing class
and retain its other lifecycle and URL methods.

```ts
// Keep this declaration first in this module.
@NativeClass()
class OrientationDelegate extends UIResponder implements UIApplicationDelegate {
	static ObjCProtocols = [UIApplicationDelegate]
	applicationSupportedInterfaceOrientationsForWindow(
		_app: UIApplication,
		window: UIWindow,
	): UIInterfaceOrientationMask {
		return getIOSSupportedInterfaceOrientations(window)
	}
}
import { Application } from '@nativescript/core'
import { getIOSSupportedInterfaceOrientations } from '@octane-xplat/screen-orientation'

Application.ios.delegate = OrientationDelegate
```

Create an empty `src/orientation-delegate.android.ts` with `export {}`. Import
the unsuffixed module in the phone entry before `Application.run()`; preserve
the entry's existing renderer setup. Rebuild and reinstall after changing the
plist. The [maintained delegate example](examples/orientation-delegate.ios.ts)
is included in the package's source typecheck.

```ts
import './orientation-delegate'
// Keep the entry's existing application/renderer startup below this import.
```

## Restore the default and release listeners

The service controls the app's primary window. Requests run in call order;
the latest successful request owns its policy. Unlock restores the platform's
default policy, rather than a previous caller's lock. On iOS, that means
all-but-upside-down within the app's declared orientations. On Android, the
system chooses the orientation. In a browser, unlock releases the native lock.

```ts
import { unlockAsync } from '@octane-xplat/screen-orientation'

export async function leaveWideLayout(): Promise<string> {
	try {
		await unlockAsync()
		return 'The default orientation policy is active.'
	} catch (error) {
		return `Could not restore orientation: ${String(error)}`
	}
}
```

Keep each subscription and remove it when its owning page/component closes.
As in Expo, notifications represent portrait-to-landscape or
landscape-to-portrait transitions. An upright-to-upside-down flip on the same
axis does not emit. Removing a subscription twice is safe.

```ts
import { addOrientationChangeListener } from '@octane-xplat/screen-orientation'

const subscription = addOrientationChangeListener((event) => {
	console.log('Interface orientation:', event.orientationInfo.orientation)
	console.log('Active policy:', event.orientationLock)
})
// In the owning page's unload handler or effect cleanup:
subscription.remove()
```

On iOS, events also carry layout size classes. `COMPACT` means a smaller layout
allocation and `REGULAR` means a larger one; these values describe the interface's
available space. They are not device-model or physical-orientation readings.

```ts
import { SizeClassIOS, addOrientationChangeListener } from '@octane-xplat/screen-orientation'

const layoutSubscription = addOrientationChangeListener((event) => {
	if (event.orientationInfo.horizontalSizeClass === SizeClassIOS.COMPACT) {
		console.log('Use the compact layout.')
	}
})
// In the same owning page/component's cleanup:
layoutSubscription.remove()
```

## Use platform policies

The portable lock values are `DEFAULT`, `ALL`, `PORTRAIT`, `PORTRAIT_UP`,
`PORTRAIT_DOWN`, `LANDSCAPE`, `LANDSCAPE_LEFT`, and `LANDSCAPE_RIGHT`.
`OTHER` and `UNKNOWN` are query results and cannot be passed to `lockAsync`.
For a platform-specific policy, pass exactly one matching field. These examples
belong in separate platform handlers:

```ts
import {
	Orientation,
	WebOrientationLock,
	lockPlatformAsync,
} from '@octane-xplat/screen-orientation'

export const uprightIOS = () =>
	lockPlatformAsync({
		screenOrientationArrayIOS: [Orientation.PORTRAIT_UP],
	})
export const followUserAndroid = () =>
	lockPlatformAsync({
		screenOrientationConstantAndroid: 13, // ActivityInfo.SCREEN_ORIENTATION_FULL_USER
	})
export const naturalWeb = () =>
	lockPlatformAsync({
		screenOrientationLockWeb: WebOrientationLock.NATURAL,
	})
```

Policy queries read native UIKit/Activity state on phones. Browsers have no
policy getter: their result is the last request accepted through this module,
or `UNKNOWN` before one succeeds. After browser unlock, the portable result is
`DEFAULT` and the web-specific result is `UNKNOWN`. A different library's lock
or an external fullscreen exit cannot be inferred from that cached request.

```ts
import {
	getOrientationLockAsync,
	getPlatformOrientationLockAsync,
} from '@octane-xplat/screen-orientation'

console.log(await getOrientationLockAsync())
console.log(await getPlatformOrientationLockAsync())
```

## Platforms and qualification

| Host                        | Boundary                                                                                                                                                                                                                                                      |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Browser                     | Uses the modern Screen Orientation API. Locking may require fullscreen, a user gesture, or an installed app. Sandbox and OS refusals reject. The package never enters fullscreen for the caller.                                                              |
| iOS                         | Observes a primary `UIWindowScene`; locks require the delegate callback, iOS 16+, declared orientations, and full-screen iPad configuration. Upside-down iPhone locks are outside this subset. Modal controllers and resizable windows can refuse changes.     |
| Android                     | Uses the primary Activity's `requestedOrientation`, display rotation, and resource configuration. Rejects locking in multi-window/Picture-in-Picture and Android 16 large-screen modes that can ignore the request. **Compilation/device runtime unverified.** |
| Native AppKit, GTK, Windows | Unavailable. A desktop window's aspect ratio is not screen orientation; this package does not rotate the user's entire display. Embedded browser hosts use their actual browser capabilities.                                                                 |

Guard queries/listeners on hosts without the Screen Orientation API or a
primary phone window. The exported contract stays the same on every target.
Deprecated Expo listener-removal aliases are omitted; use `subscription.remove()`.

```ts
import { ScreenOrientation, getOrientationAsync } from '@octane-xplat/screen-orientation'

if (await ScreenOrientation.isAvailable()) {
	console.log(await getOrientationAsync())
}
```

The maintained browser fixture exercises real Chromium APIs with CDP screen
emulation, including events, accepted policy requests, unlock and sandbox
rejection. It does not prove physical display rotation or lock enforcement.
The skymac.local iOS 26.2 unsigned release fixture passes native scene/policy
changes, default restoration, missing-delegate rejection, real UIKit geometry
refusal/recovery and subscription cleanup (30 assertions across three launches).
Physical devices, iPad/multitasking, signing and native npm-installed consumers
are unverified. Android remains unverified by request.

See [Expo's API reference](https://docs.expo.dev/versions/latest/sdk/screen-orientation/)
and the repository's [implementation and verification record](../../.agents/docs/notes/screen-orientation.md).
