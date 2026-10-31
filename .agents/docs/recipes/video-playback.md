# Ship video playback on web and native

ID: video-playback
Targets: web, ios, android, macos
Related APIs: @octane-xplat/video (Video), @nstudio/nativescript-exoplayer, AppKit AVPlayerLayer

## Starting point

A working scaffolded app and a known playable video URL reachable by all targets.
The reader can build web and native apps. Streaming protocols, background audio,
and DRM are outside this recipe's scope.

## Requirements

- Install required native dependencies and mount a bounded video surface.
- Start and pause playback using the supported controls.
- Explain which playback behavior and failure signals vary by target.

## Acceptance criteria

- AC1: The reader can follow the dependency and component instructions to build and mount a video on each target without discovering missing setup from framework source.
- AC2: A maintained example lets the reader play and pause a known clip and verify the resulting state on each target.
- AC3: The reader can identify the supported error signals and hosted-surface limits without assuming native failures emit the web error callback.
- AC4: AppKit owns its Swift surface/player, source/timer/notification/seek lifetime, stable imperative handle and shared transport. Honor basic source/fit/mute/loop/playing/poster and millisecond callbacks, last pre-ready seek and explicit retry without stale work. Keep native compilation/playback/input/AX/package proof separate from owner/source cases and keep Lightbox/advanced engine scope explicit.

## Documentation

- AC1: [Video setup and props](../../../docs/app/primitives.md#video-playback).
- AC2: [Playback controls](../../../docs/app/primitives.md#video-playback) and maintained [VideoDemo](../../../packages/demos/src/VideoDemo.tsrx).
- AC3: [Video limits](../../../docs/testing/known-limits.md#primitives).
- AC4: [Package subset/setup](../../../packages/video/README.md#experimental-appkit-playback), [guide](../../../docs/app/primitives.md#video-playback), nine [owner source cases](../../../packages/video/tests/video-owner.macos.test.ts), maintained [VideoDemo](../../../packages/demos/src/VideoDemo.tsrx), [idle/manual AppKit fixture](../../../examples/probes/video.macos.tsrx) and [target note](../exploration.md#operational-evidence). All cases/fixture/packing/builds require separate execution evidence. AppKit errors are generic; mobile plugin errors remain unavailable. Native Swift/discovery, playback/audio/seek/loop/fit, callbacks/threads, input/AX, sandbox, memory/power and packaging require separate target qualification; the recipe's original requirements remain evidence gates rather than source passes.
