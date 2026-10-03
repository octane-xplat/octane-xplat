# Play a Lottie animation on web, mobile, and macOS

ID: lottie-animation
Targets: web, ios, android, macos
Related APIs: @octane-xplat/lottie (Lottie, LottieHandle, LottieProps), lottie-web, @nativescript-community/ui-lottie, Airbnb Lottie 4.6.1

## Starting point

A working scaffolded app and a Lottie JSON or `.lottie` asset. Web and mobile
accept the source forms listed in the limits table. AppKit accepts inline JSON,
raw JSON in `src`, absolute local JSON files, `file://` URLs, and HTTPS JSON.

## Requirements

- Install the leaf package and mount a bounded animation on each target. The
  AppKit engine is compiled from source bundled with the leaf; no extra engine
  package is installed by the app.
- Control playback declaratively (`playing`, `progress`, `loop`, `speed`)
  and imperatively (`ref` handle).
- Understand the normalized units (progress 0..1, durations ms) and which
  npm `ui-lottie` 6.0.0 gaps the leaf works around pending upstream fixes.

## Acceptance criteria

- AC1: The reader can install `@octane-xplat/lottie` and mount an animation on each target without discovering missing setup from framework source — web/mobile engines and the AppKit Swift source ship with the leaf.
- AC2: A maintained example lets the reader play/pause/stop/seek/loop/speed an animation and observe `onLoaded`/`onEnded`/`onError` on each target.
- AC3: The reader can identify which source forms work on which plugin version and what `onError` coverage exists before relying on them.

## Documentation

- AC1: [Lottie setup and props](../docs/app/primitives.md#lottie-animations).
- AC2: [LottieDemo](../packages/demos/src/LottieDemo.tsrx) — bounded player with play/pause/stop, loop, seek, and speed controls.
- AC3: [Lottie limits](../docs/verify/known-limits.md#primitives) — plugin-version behavior matrix.
