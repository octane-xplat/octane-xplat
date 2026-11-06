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
`realtime` independently — check the flag for the feature you use. With
`realtime`, `startRealtime(intensity)` returns a session for
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

From the app folder, prepare the pinned Pulsar 1.4.0 package. This downloads
its source with Git and applies Xplat's sound-simulation fix. Git and network
access are needed on the first run; later runs reuse the validated local copy.
Keep `.xplat/` in the app's `.gitignore`.

```sh
bun run xplat-prepare-haptics-ios .xplat/pulsar-ios
```

In `nativescript.config.ts`, use the prepared local package and include the
haptics bridge. Replace an existing remote Pulsar entry, then rebuild the native
app. A JavaScript refresh cannot replace the linked Swift package. A build error
about `Pulsar.xplatSilent` means the app still links an unpatched dependency.

```ts
import type { NativeScriptConfig } from '@nativescript/core'

export default {
  ios: {
    SPMPackages: [
      { name: 'Pulsar', libs: ['Pulsar'], path: '.xplat/pulsar-ios' },
    ],
    NativeSource: [
      {
        name: 'XplatPulsarBridge',
        path: './node_modules/@octane-xplat/haptics/platforms/ios/src/**/*.swift',
      },
    ],
  },
} satisfies NativeScriptConfig
```

The prepared package keeps feedback silent in Debug, Release, and the simulator.
Disabling sound simulation does not deactivate another service's audio session.
A simulator cannot prove tactile output; verify feedback on a supported iPhone.
If preparation reports a modified cache, choose a fresh destination and update
its configuration path rather than overwriting local changes.

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
