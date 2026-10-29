# Screen orientation

`@octane-xplat/screen-orientation` mirrors Expo 58.0.3's portable constants,
queries, lock methods, platform-policy shapes and subscription.remove(). It
omits deprecated listener-removal aliases. Constant objects use erasable
TypeScript. All target exports/declarations match; unavailable native desktop
hosts reject rather than treating a resized window as OS orientation.

The backend uses public platform APIs through NativeScript core 9.1.3. The
community plugins studied either replace controller prototypes/use private
UIDevice KVC, or select the first connected scene and ignore asynchronous
geometry errors. Those mechanisms mismatch the window ownership and rejection
contract. The leaf introduces no native or JavaScript engine dependency; its
separate primary-window lifecycle warrants a service package.

## Ownership

Each mobile operation captures the primary UIWindow/Activity when it begins.
All mutations share a call-order queue that recovers after a failed request.
An operation rejects if its captured window disappears or fails to reach an
allowed interface orientation within four seconds. A failed request restores
the previous policy. No global swizzling, controller reparenting, replacement
Activity or application-wide physical-orientation sensor is installed.

iOS stores policies in a WeakMap keyed by UIWindow. The app explicitly forwards
its UIApplicationDelegate supported-orientations callback to the public helper.
Support requires forwarding, a scene, iOS 16+, compatible Info.plist orientations,
and full-screen configuration on iPad. A request invalidates controller policy,
checks UIKit's applied mask, calls requestGeometryUpdate, propagates its error
handler and waits for the real scene orientation. It never uses UIDevice's
private orientation setter. The portable iPhone subset excludes upside-down
policies. DEFAULT intersects all-but-upside-down with declared orientations.

Android reads requestedOrientation from the primary Activity and combines
Display.rotation with resource Configuration.orientation for actual interface
state. The numeric mapping follows Expo: LANDSCAPE_LEFT uses reverse-landscape,
LANDSCAPE_RIGHT uses landscape. Android 16 large screens, multi-window and
Picture-in-Picture reject locks instead of relying on a setter the OS may ignore.
Compilation and runtime are deferred; this paragraph records source behavior.

Subscriptions bind the primary NativeWindow's orientation event and rebind on
primaryWindowChanged. Removal releases only those listeners. iOS also dispatches
a settled notification after a successful geometry request, deduplicated by the
shared portrait/landscape axis filter. No new lock is carried to a newly promoted
primary window. A page that unlocks must own that decision; there is no automatic
stack of locks or restoration of another caller's policy.

Web uses screen.orientation.type/change/lock/unlock without legacy fallbacks or
implicit fullscreen entry. Native browser promises own request acceptance.
There is no web policy getter: the leaf remembers its last accepted request,
starts UNKNOWN, keeps history on rejection, and reports DEFAULT plus web UNKNOWN
after unlock. External libraries/fullscreen loss can invalidate that history.
CDP's forced screen orientation can outlive an accepted lock, so emulation is
not physical enforcement evidence.

Native AppKit/GTK/Windows APIs for rotating a physical monitor affect the whole
desktop, not this app's interface policy. Window aspect-ratio changes do not
implement screen rotation. Those backends remain explicitly unavailable;
future native testing uses skymac.local, andromeda.local or ssh windy as relevant.

## Verification

Four shared tests pass for request ordering/failure recovery, validation
snapshots, axis notifications/removal and unavailable desktop behavior.
Chromium passes 12 real API assertions using CDP-emulated screen orientations:
queries/events, same-axis filtering, cleanup, accepted policy history, native
unlock and sandbox rejection. Emulation does not prove physical enforcement.
Combined source/example typechecking and six-target packed declarations without
native ambient types pass. Creator catalog-owner typechecking passes; generated
catalog dependent apps remain batched for the goal's end.

skymac.local iOS 26.2 passes three cold unsigned release cases and 30 assertions:
21 configured checks, 4 missing-delegate checks, and 5 conflicting-delegate checks.
The fixture checks actual primary scene state, both landscape directions, native
delegate masks, size classes, default restoration, idempotence, subscription
cleanup, key-window/input ownership, and recovery. The conflicting delegate
provokes a real requestGeometryUpdate error (requested landscapeLeft while
portrait is supported); the error reaches the caller and a later request succeeds.
SDK UIOrientation.h independently confirms that interface landscapeLeft=4 and
landscapeRight=3, opposite UIDevice's landscape constants. The draft initially
reversed them; the OS error text caught the mistake before commit.

Native input/dependency cache identity changed once while packaging was still
being stabilized, requiring a second unsigned build. Later iterations reuse that
executable and refresh release JavaScript/resources. Final raw evidence is
/tmp/xplat-orientation-ios-verified.log locally and orientation-release-results.json
under the task-owned fe688a5e4a64b473/build-63d67c717a6af021 probe on skymac.local.
No visual analysis was used. Physical device input/rotation lock, iPad multitasking,
iOS 27 runtime, signing and native npm-installed consumers remain unverified.
Android TypeScript checks are distinct from explicitly deferred Android
compilation/device runtime. npm stub/trusted publisher setup is a release
prerequisite, not an action taken by this implementation.

## UIKit policy queries

UIApplication.supportedInterfaceOrientations(for:) reports app defaults. Apple's
reference explicitly says UIKit does not use it when the delegate supplies the
supported-orientations callback. It is not an active-policy getter or a trigger
for a fresh callback. The first runtime test incorrectly used that defaults
query to validate a narrow policy; it remained 26 while the real delegate returned 2.
The adapter now queries the actual delegate callback, verifies scene orientation
separately, and observes UIKit's geometry error handler. This corrects the local
assumption; it is not an upstream workaround.

## NativeScript decorator statement boundary

The skymac.local release fixture's NativeScript Vite 8.0.17 NativeClass transform
joined the preceding TypeScript/import statement directly to generated `var
OrientationDelegate`. Valid semicolon-free source then failed the Vite parser.
An explicit semicolon before the decorator allowed bundling, but formatting
removed it again. The maintained delegate declares its NativeClass first, with
hoisted module imports below it. That avoids concatenating a preceding statement.
A UIResponder.extend attempt did not reach the root-page result in the core 9.1.3
custom-delegate scene lifecycle; it is not the supported setup. This is local
source adaptation, not evidence that NativeScript fixes the transform. Source typechecking
alone did not detect the release-bundle failure.

## References

- [Expo ScreenOrientation](https://docs.expo.dev/versions/latest/sdk/screen-orientation/)
- Expo 58.0.3 ScreenOrientationUtilities.swift, ModuleOrientation/ModuleOrientationLock and Android OrientationLock mappings.
- NativeScript core 9.1.3 NativeWindow events/surfaces and custom-delegate scene defaults.
- [UIApplication default orientation query](<https://developer.apple.com/documentation/uikit/uiapplication/supportedinterfaceorientations(for:)>)
- [UIKit requestGeometryUpdate](<https://developer.apple.com/documentation/uikit/uiwindowscene/requestgeometryupdate(_:errorhandler:)>)
- [Android Activity orientation configuration](https://developer.android.com/guide/topics/manifest/activity-element)
- Community source comparison: @irman/nativescript-screen-orientation1.1.2 and @wuilmerj24/screen-orientation1.0.6; no implementation code copied.
