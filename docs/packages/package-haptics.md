# `@octane-xplat/haptics`

> Advanced, capability-aware haptics for Octane xplat

Haptic feedback for Octane xplat apps, in two layers. The `haptics`
service mirrors the platform contract — `impact(style)`,
`notification(kind)`, `selection()`. `createHaptics()` is the advanced
engine: named presets, timed `playPattern` envelopes (`{duration, points:
[{at, intensity, sharpness}]}`), gesture-driven realtime sessions
(`startRealtime()` → `{update, stop}`), and cancellation.

```sh
bun add @octane-xplat/haptics
```

```ts
import { createHaptics, haptics } from '@octane-xplat/haptics'

if (haptics.supported) {
  haptics.impact('medium') // simple path
  haptics.notification('success')
}

const engine = createHaptics() // advanced path
if (engine.capabilities().presets) engine.play('success')
if (engine.capabilities().patterns) {
  engine.playPattern({ duration: 300, points: [{ at: 0, intensity: 1 }] })
}
```

`capabilities()` reports `supported` plus `presets`, `patterns`, and
`realtime` independently — check the flag for the feature you use. On
Android, `presets` also reports `false` when the engine was created without
a foreground Activity (the pinned Pulsar SDK builds its preset wrapper over
the Activity) — a background-launched engine still reports `patterns` and
`realtime` as available. With `realtime`,
`startRealtime(intensity)` returns a session for
gesture-driven feedback: call `update(intensity, sharpness)` as the
gesture changes and `stop()` when it ends or is cancelled.

```ts
// engine is the createHaptics() instance above.
if (engine.capabilities().realtime) {
  const session = engine.startRealtime(0.2)
  session.update(0.8, 0.5)
  session.stop()
}
engine.dispose() // after the owner has finished all feedback
```

Native Android uses Pulsar 1.3.0 and needs compile SDK 36+ (runtime support
reaches API 24). Web uses the Vibration API, which many desktop browsers expose
but ignore.

## Set up iOS

Install `@octane-xplat/haptics` in the native app's dependencies, then rebuild
the iOS app. NativeScript automatically includes the Swift bridge and prepares
the pinned Pulsar 1.4.0 dependency. No preparation command or haptics-specific
`nativescript.config.ts` entries are needed.

```sh
bun add @octane-xplat/haptics
bun run xplat build --targets ios
```

The first iOS preparation downloads Pulsar with Git and applies Xplat's
sound-simulation fix, so Git and network access are required. Later preparations
reuse the validated copy inside the installed haptics package's `.xplat/`
folder. Web and Android do not run this Swift preparation.

If upgrading from manual setup, remove the `Pulsar` entry from
`ios.SPMPackages` and the `XplatPulsarBridge` entry from `ios.NativeSource` in
`nativescript.config.ts`. App-authored Swift package entries override plugin
entries. A build error about `Pulsar.xplatSilent` means the app still links an
unpatched dependency. A JavaScript refresh cannot replace a native rebuild.

The prepared package keeps feedback silent in Debug, Release, and the simulator.
Disabling sound simulation does not deactivate another service's audio session.
A simulator cannot prove tactile output; verify feedback on a supported iPhone.
If preparation reports a modified cache, preserve your changes by moving the
reported cache folder elsewhere, then rebuild to prepare a fresh copy.

## Haptics while using the microphone

Microphone capture can suppress iOS haptics, including during camera preview
with audio enabled. To allow them explicitly, follow the
[camera recording policy](../app/movie-capture.md#allow-ios-feedback-while-the-microphone-is-active).
The option also permits system sounds; consider whether they belong in your
recording.

macOS uses `NSHapticFeedbackManager`, which gives discrete trackpad
feedback on compatible hardware: `presets` reports `true` while
`patterns` and `realtime` report `false`. `selection` plays an alignment
tick, `impact-*` presets play a level-change bump, and `success`,
`warning`, `error` play generic feedback.

Guide: [Media services](https://octane-xplat.goddardai.org/media-services); per-target
availability: [platform notes](https://github.com/octane-xplat/octane-xplat/blob/main/.agents/docs/notes/platform-notes.md).

[Generated API reference](https://octane-xplat.goddardai.org/api-haptics).
