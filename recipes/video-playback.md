# Ship video playback on web and native

ID: video-playback
Targets: web, ios, android
Related APIs: @octane-xplat/video (Video), @nstudio/nativescript-exoplayer

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

## Documentation

- AC1: [Video setup and props](../docs/app/primitives.md#video-playback).
- AC2: [Playback controls](../docs/app/primitives.md#video-playback) and maintained [VideoDemo](../packages/demos/src/VideoDemo.tsrx).
- AC3: [Video limits](../docs/verify/known-limits.md#primitives).
