# Play a Lottie animation on web and native

ID: lottie-animation
Targets: web, ios, android
Related APIs: @octane-xplat/lottie (Lottie, LottieHandle, LottieProps), lottie-web, @nativescript-community/ui-lottie

## Starting point

A working scaffolded app and a Lottie JSON or `.lottie` asset (inline object
or reachable file/URL). The reader can build web and native apps.

## Requirements

- Install the leaf package and mount a bounded animation on each target.
- Control playback declaratively (`playing`, `progress`, `loop`, `speed`)
  and imperatively (`ref` handle).
- Understand the normalized units (progress 0..1, durations ms) and which
  npm `ui-lottie` 6.0.0 gaps the leaf works around pending upstream fixes.

## Acceptance criteria

- AC1: The reader can install `@octane-xplat/lottie` and mount an animation on each target without discovering missing setup from framework source — both engines travel as the leaf's own dependencies.
- AC2: A maintained example lets the reader play/pause/stop/seek/loop/speed an animation and observe `onLoaded`/`onEnded`/`onError` on each target.
- AC3: The reader can identify which source forms work on which plugin version and what `onError` coverage exists before relying on them.

## Documentation

- AC1: [Lottie setup and props](../docs/primitives.md#lottie-animations).
- AC2: [LottieDemo](../packages/demos/src/LottieDemo.tsrx) — bounded player with play/pause/stop, loop, seek, and speed controls.
- AC3: [Lottie limits](../docs/known-limits.md#primitives) — plugin-version behavior matrix.
