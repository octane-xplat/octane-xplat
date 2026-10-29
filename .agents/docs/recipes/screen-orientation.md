# Observe and choose the primary window's screen orientation

ID: screen-orientation
Targets: web, ios, android
Related APIs: @octane-xplat/screen-orientation, ScreenOrientation, Orientation, OrientationLock, lockAsync, unlockAsync, addOrientationChangeListener

## Starting point

A working browser or NativeScript phone app with a flexible layout. The app
owns its iOS delegate and native resources. Orientation means the painted
interface, not physical device sensors or a desktop window's aspect ratio.

## Requirements

- Install the leaf and complete host configuration.
- Read actual interface orientation and query supported lock policies.
- Apply, inspect and restore native policy; handle rejection.
- Own subscriptions and concurrent requests explicitly.
- Keep platform and verification limits visible.

## Acceptance criteria

- AC1: The reader can install the package, forward the iOS app-delegate callback before startup without replacing an existing delegate's methods, configure supported orientations/full-screen behavior and distinguish unavailable hosts.
- AC2: The reader can query native screen orientation, understand left/right and size-class values, check policy support, and distinguish interface state from physical device sensors or window dimensions.
- AC3: Portable and platform lock requests validate input, apply the actual native policy, preserve previous policy on rejection, and restore the documented DEFAULT policy; OS restrictions remain observable failures.
- AC4: The reader can subscribe to portrait/landscape transitions, remove exactly one subscription idempotently, understand primary-window scope and request ordering, and avoid implicit restoration of another caller's policy.
- AC5: The guidance distinguishes browser policy history from a native getter, desktop unavailability from phone support, emulated/build evidence from physical behavior, and deferred Android runtime from a pass.

## Documentation

- AC1: [First use](../../../packages/screen-orientation/README.md#add-orientation-controls-to-an-app), [iOS configuration](../../../packages/screen-orientation/README.md#configure-ios) and [maintained delegate](../../../packages/screen-orientation/examples/orientation-delegate.ios.ts).
- AC2: [Portable queries and platform boundaries](../../../packages/screen-orientation/README.md#platforms-and-qualification), [public contract](../../../packages/screen-orientation/src/types.ts) and [native fixture](../../../packages/screen-orientation/tests/runtime.ios.ts).
- AC3: [Restore the default](../../../packages/screen-orientation/README.md#restore-the-default-and-release-listeners), [platform policies](../../../packages/screen-orientation/README.md#use-platform-policies), [browser runtime](../../../packages/screen-orientation/tests/runtime.web.mjs) and [native runtime](../../../packages/screen-orientation/tests/runtime.ios.ts).
- AC4: [Subscription ownership](../../../packages/screen-orientation/README.md#restore-the-default-and-release-listeners), [shared tests](../../../packages/screen-orientation/tests/service.test.ts) and [owning note](../notes/screen-orientation.md#ownership).
- AC5: [Qualification](../../../packages/screen-orientation/README.md#platforms-and-qualification) and [verification record](../notes/screen-orientation.md#verification).
