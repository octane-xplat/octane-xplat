# Launch-screen control and qualification

The leaf follows Expo SplashScreen58.0.12's four method signatures and
`SplashScreenOptions`: preventAutoHideAsync returns Promise<boolean>, hide
returns void, hideAsync acknowledges the same dismissal request, and setOptions
accepts duration/fade. The controller is process-scoped and cannot re-show a
finished startup. Platform entry points keep browser/desktop imports safe and
report explicit unavailability. See the [package guide](../../../docs/packages/package-splash-screen.md).

## Native lifetime

| State | Trigger | Ownership |
| --- | --- | --- |
| Waiting | First early call initializes the native controller | First normal iOS window / first Android activity |
| Held | Synchronous native prevent request | One hold and one deadline, shared by repeated calls |
| Visible | Window/activity startup reaches its native launch surface | iOS storyboard controller/view or Android pre-draw listener |
| Hiding | Dismissal requested | Native fade/exit animation may still finish asynchronously |
| Hidden | Dismissal, native backstop or owner destruction | Startup stays closed; late prevention returns false |

The supported signature is familiar; availability behavior is explicit rather
than Expo's unsupported-host no-op. An early duplicate prevention returns true.
A request after dismissal returns false. hideAsync resolves when the native
request is accepted, without waiting for animation completion. Duration is
finite 0–60000 ms, default400. Fade is an iOS option. Android31+ can customize
its system exit animation; lower versions support hold/hide but reject an
explicit duration instead of silently ignoring it.

iOS instantiates the app's compiled launch storyboard in a retained controller
and adds its view to the first normal app window. This continues the OS launch
resource without taking key-window ownership or disabling the app window.
Window resizing uses native autoresizing. The controller observes only its
window and drops notification/KVO observers, scheduled work and view ownership
when dismissed. It does not implement image generation or an Expo config plugin.

The iOS controller is TypeScript in `src/backend.ios.ts`, calling UIKit
notifications, KVO and libdispatch directly through the NativeScript bridge —
the former `platforms/ios` Swift wrapper is removed, so Apple consumers need no
plugin rebuild. It registers its `UIWindowDidBecomeVisibleNotification` block
observer during entry-module evaluation (before `Application.run()` invokes
`UIApplicationMain`), attaches on the first normal unhidden window, and
reattaches through a `rootViewController` KVO observer when NativeScript's
scene delegate assigns the root and UIKit drops the existing subviews. The hold
deadline uses `dispatch_after` on the main queue (`NSOperationQueue.mainQueue`
.`underlyingQueue`; `dispatch_get_main_queue` is a C macro outside the runtime
metadata), the next-turn auto-hide uses `addOperationWithBlock`, and both carry
a cancelled flag matching the removed `DispatchWorkItem` semantics. The Android
Java bridge is unchanged.

NativeScript core9.1.3's scene delegate makes its primary window visible before
resolving the root controller. A release probe recorded the visible notification
with root=false. Gating attachment on a root misses that event. Attaching at
the event is also insufficient: assigning the root later removes the existing
window subviews. The controller observes rootViewController and reattaches the
retained continuation synchronously after root assignment. The maintained
runtime checks verify frontmost order, full-window geometry and interaction
ownership in addition to native state. This behavior is an integration
constraint, not evidence that NativeScript itself has splash hold/hide APIs.

Android uses a Java-owned Application.ActivityLifecycleCallbacks subscription
and ViewTreeObserver.OnPreDrawListener. It attaches onActivityStarted after
NativeScript applies SET_THEME_ON_LAUNCH in onActivityCreated, preserving decor
initialization order. It blocks the first draw while held,
then removes the listener and lifecycle callbacks. API31 exit-view symbols are
isolated in a nested class for older-device verification. The duration option
controls the native system exit view on API31+. No new AndroidX dependency or
replacement Activity/Application is introduced. Android compilation and runtime
qualification are deferred by the user; this is source evidence only.

The first prevention schedules a native timeout (default30s, configurable
100–120000 whole milliseconds). Repeated requests do not reset it. Neither
platform uses a JavaScript timer to release an abandoned hold. The main thread
still must run; this cannot recover a blocked UI thread or a terminated process.
Splash dismissal never confirms an OTA update. App readiness and Updates
markHealthy remain separately owned by the consuming application.

## Verification

The late-call guard uses Application.started. During Page.loaded, NativeScript
has not yet adopted its global root reference, so getRootView() cannot identify
a late request. The release regression exposed that difference; the final
guard returns false without installing another observer.

Stubbed-host Vitest cases exercise the TypeScript controller's state machine
(guards, hold/deadline, attach/reattach, disposal); the packed consumer checks
six target declarations and that no iOS native wrapper ships; `test:ios-api`
checks the iPhoneSimulator SDK and @nativescript/types-iOS declarations carry
every bound member. On iOS26.2, five cold-launch cases pass lifecycle
assertions in an unsigned release app: manual hold/fade, auto-hide, native
timeout, early hide, and late prevention. Frontmost order, geometry, window
ownership and notification/KVO/timeout cleanup are checked without
screenshots. The final run reuses the compiled native executable with
refreshed release JavaScript. Signed devices, OS touch delivery, pixel parity
and npm-installed native consumers remain unverified.

The maintained fixture builds one unsigned release and launches five cases:
manual hold/fade, default auto-hide, native timeout, early hide and late hold.
Each uses a fresh nonce for result matching. It writes the standalone release
entry instead of booting the development probe host. --reuse-build and
--refresh-js allow focused resource-only iterations; native source changes
require a build. No screenshots or pixel analysis are performed.

skymac.local ran out of disk space during simulator installation. Only owned
completed OTA and unqualified splash build caches were removed; source, private
input records and result/build logs were preserved. The host's older repository
library lacked the current capability export, so the fixture uses this
checkout's library source and emitted artifacts in its private snapshot.

Browser and desktop hosts do not expose this package's phone launch lifecycle.
The current AppKit host owns ordinary NSWindow activation; UIKit launch
storyboards are not an AppKit API. GTK/Windows host startup would need explicit
host integration for a separate loading surface. No such implementation or
runtime qualification is claimed. Unsupported entry points are checked through
source/declaration consumers; any future native tests must use skymac.local,
andromeda.local or ssh windy according to target.

## References

- [Expo SplashScreen](https://docs.expo.dev/versions/latest/sdk/splash-screen/)
- [Android splash lifecycle and first-draw hold](https://developer.android.com/develop/ui/views/launch/splash-screen)
- NativeScript core9.1.3 application.ios.js iOSApplication.runAsMainApp invokes UIApplicationMain from JavaScript, so entry-module calls land before it.
- NativeScript core9.1.3 application.ios.js SceneDelegate.sceneWillConnectToSessionOptions makes the primary window visible before resolving content.
- Expo and Capacitor source informed the platform/lifecycle comparison; their React/Capacitor host ownership does not fit the NativeScript host directly.
