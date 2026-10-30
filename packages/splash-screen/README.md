# @octane-xplat/splash-screen

Keep a phone app's launch screen visible until its first page is ready, then
dismiss it. The methods follow the current
[Expo SplashScreen API](https://docs.expo.dev/versions/latest/sdk/splash-screen/).
iOS continues the configured launch storyboard in the app's primary window;
Android holds the system launch screen by delaying its first draw.

## Keep the launch screen until a page loads

Start with a working phone app. Install the package and rebuild the native
binary so it contains the UIKit/Android bridge. JavaScript updates alone cannot
install that bridge. Keep the app's existing launch storyboard and Android theme.

```sh
bun add @octane-xplat/splash-screen
bun run ns build ios --release
bun run ns build android --release
```

Create `src/splash.mobile.ts` with the following code. Import it before the
native entry calls `Application.run()`. Prevention reaches native code
synchronously, before the returned promise settles. Repeated early requests
share one process-start hold; they do not create separate owners.

```ts
import { Page } from '@nativescript/core'
import { SplashScreen, hide, preventAutoHideAsync } from '@octane-xplat/splash-screen'

const supported = SplashScreen.capabilities.hold
if (supported) {
  void preventAutoHideAsync().catch(() => {
    console.warn('The launch screen could not be held')
  })
}

export function revealWhenLoaded(page: Page): void {
  if (!supported) return
  const reveal = () => hide()
  if (page.isLoaded) reveal()
  else page.once(Page.loadedEvent, reveal)
}
```

In the starter's existing `src/main.ts`, add the import near the top. Inside
`entry.create`, call the helper after `renderNativeScriptApp(page, App)` and
before `frame.navigate(...)`. These are additions to that existing file; its
`page` and renderer setup stay in their current scope.

```ts
import { revealWhenLoaded } from './splash.mobile'

// Inside entry.create, after rendering its Page:
revealWhenLoaded(page)
```

On a fully closed release launch, the launch image remains while that Page is
created. The helper dismisses it when the Page reports that it loaded. The
[maintained helper](examples/startup.mobile.ts) uses the same code. Development
hosts may have already drawn their placeholder before app modules load; use
a cold release launch to qualify this workflow.

## Wait for required data and handle failure

Call dismissal after the page and required data are ready. Put the app's error
state on its already mounted page if preparation fails, then release the hold
so the user can reach that state. The example below is called from that page's
loaded callback; its caller supplies preparation and error-state functions.

```ts
import { hideAsync } from '@octane-xplat/splash-screen'

export async function finishStartup(
  prepare: () => Promise<void>,
  showStartupError: (error: unknown) => void,
) {
  try { await prepare() }
  catch (error) { showStartupError(error) }
  finally { await hideAsync() }
}
```

`hide()` returns immediately. `hideAsync()` resolves after requesting the same
dismissal; it does not wait for a fade to finish. Repeated dismissal is safe.
A request made after dismissal returns `false` from `preventAutoHideAsync()`
and leaves startup closed.

```ts
import { hide, hideAsync, preventAutoHideAsync } from '@octane-xplat/splash-screen'

export async function dismissStartup() {
  hide()
  await hideAsync()
  console.log(await preventAutoHideAsync()) // false after dismissal
}
```

## Choose an exit animation

Set options before startup dismissal. iOS supports an optional fade; Android
uses its system exit view on Android 12 and newer. `fade` is iOS-only, matching
Expo's option scope. Android 11 and older support hold/dismiss but reject an
explicit animation duration. The default duration is 400 ms; explicit values
must be finite and between 0 and 60000 ms.

```ts
import { SplashScreen, setOptions } from '@octane-xplat/splash-screen'

if (SplashScreen.capabilities.animationDuration) {
  setOptions({ duration: 250, fade: true })
}
```

## Configure native startup

Keep a valid `UILaunchStoryboardName` and compiled storyboard in the iOS app.
The starter uses `LaunchScreen.storyboard`. The service reuses that resource,
including its layout and assets. Expo's `app.json` config plugin is not used
by NativeScript; edit your app's `App_Resources` files and rebuild the binary.

```xml
<!-- Inside App_Resources/iOS/Info.plist's top-level dict: -->
<key>UILaunchStoryboardName</key>
<string>LaunchScreen</string>
```

A timer in native code releases an abandoned hold after 30 seconds. It runs outside
JavaScript's timer system, releases its observers, and never confirms an OTA
update as healthy. Set a shorter or longer bound in native configuration,
from 100 to 120000 whole milliseconds, then rebuild. A blocked main thread or
terminated process still follows the operating system's startup behavior.

```xml
<!-- Inside the iOS Info.plist's top-level dict: -->
<key>XplatSplashScreenMaxHoldMilliseconds</key>
<integer>15000</integer>
```

```xml
<!-- Inside AndroidManifest.xml's application element: -->
<meta-data
  android:name="com.octanexplat.splashscreen.MAX_HOLD_MILLISECONDS"
  android:value="15000" />
```

Keep Android's launch theme on the starting activity and its normal app theme
in `SET_THEME_ON_LAUNCH`. The starter already supplies both. Android 12 and
newer use the OS splash format; background/icon/theme changes require a binary
rebuild. NativeScript's existing resource generator can prepare your assets.

```xml
<!-- Existing starting activity configuration in the NativeScript starter: -->
<activity android:name="com.tns.NativeScriptActivity" android:theme="@style/LaunchScreenTheme">
  <meta-data android:name="SET_THEME_ON_LAUNCH" android:resource="@style/AppTheme" />
</activity>
```

## Platforms and qualification

Browser, AppKit, GTK and native Windows entries report `hold: false`; methods
throw `UnavailabilityError`. These hosts do not expose this package's phone
launch lifecycle. Use the app's own loading state on those hosts. Check the
operation before calling it in shared startup code.

```ts
import { SplashScreen, hide } from '@octane-xplat/splash-screen'

export function revealSupportedStartup() {
  if (SplashScreen.capabilities.hold) hide()
}
```

The controller owns the first primary phone window/activity for one process
start. It cannot show the splash screen again. It does not change the app's
key-window or interaction settings, add an Expo runtime, or mark an update
healthy. Keep [OTA startup confirmation](https://octane-xplat.goddardai.org/updates#create-one-client)
after your own essential screen/data checks.

Four shared tests and skymac.local Swift 4/5 API checks pass. On iOS26.2, five
cold-launch cases pass 42 lifecycle assertions in an unsigned release app,
including manual fade, automatic dismissal, the native timeout and late calls.
The final run reuses its compiled native executable with refreshed release
JavaScript. Android compilation/runtime remains explicitly unverified. No image
inspection, pixel parity, OS touch delivery or signed-device qualification is
claimed. See the [verification record](../../.agents/docs/notes/splash-screen.md).
