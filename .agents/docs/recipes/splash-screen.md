# Keep the phone launch screen until startup is ready

ID: splash-screen
Targets: ios, android
Related APIs: @octane-xplat/splash-screen, SplashScreen, preventAutoHideAsync, hide, hideAsync, setOptions

## Starting point

A working NativeScript phone app with its existing iOS launch storyboard and
Android launch/app themes. The app owns required data preparation and its error
screen. Native binary building/signing already works.

## Requirements

- Install native code and arm the hold before Application.run().
- Reveal a mounted page when essential data is ready and handle failed startup.
- Configure supported native animations and reject invalid options.
- Release native views, listeners and deadlines after startup.
- Keep availability, qualification and OTA confirmation boundaries explicit.

## Acceptance criteria

- AC1: The reader can install/rebuild the leaf, preserve the launch resource/theme, import the startup module before Application.run(), and distinguish early, repeated and late prevention results.
- AC2: The reader can wait for the root Page and required data, request dismissal using either Expo-shaped entry point, expose an error state on failure, and understand that hideAsync acknowledges the request rather than animation completion.
- AC3: The reader can configure iOS fade and supported animation durations, reject malformed/out-of-range values, and handle Android's version-specific duration limit through capabilities.
- AC4: The native controller preserves window ownership and scene-root handoff, blocks repeated re-show, releases notification/KVO/draw/lifecycle listeners and timeout work, and expires an abandoned hold without a JavaScript dismissal timer.
- AC5: The reader can configure the native hold bound, distinguish release evidence from debug/LiveSync, identify Android/desktop/signing/input/pixel qualification gaps, and keep OTA health confirmation tied to the app's readiness.

## Documentation

- AC1: [Install and arm before startup](../../../packages/splash-screen/README.md#keep-the-launch-screen-until-a-page-loads), [maintained native helper](../../../packages/splash-screen/examples/startup.mobile.ts) and [cold release fixture](../../../packages/splash-screen/tests/ios-runtime.mjs).
- AC2: [Required data and failure](../../../packages/splash-screen/README.md#wait-for-required-data-and-handle-failure) and [runtime lifecycle cases](../../../packages/splash-screen/tests/runtime.ios.ts).
- AC3: [Exit animation](../../../packages/splash-screen/README.md#choose-an-exit-animation), [public contract](../../../packages/splash-screen/src/types.ts) and [shared tests](../../../packages/splash-screen/tests/service.test.ts).
- AC4: [Native lifetime and handoff](../notes/splash-screen.md#native-lifetime) and [runtime cases](../../../packages/splash-screen/tests/runtime.ios.ts).
- AC5: [Native configuration](../../../packages/splash-screen/README.md#configure-native-startup), [platforms and qualification](../../../packages/splash-screen/README.md#platforms-and-qualification) and [verification record](../notes/splash-screen.md#verification).
