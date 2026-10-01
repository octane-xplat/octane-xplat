# `@octane-xplat/haptics`

Capability-aware haptics for Octane xplat apps, in two layers. The simple
`haptics` service mirrors the platform contract — `impact(style)`,
`notification(kind)`, `selection()`. `createHaptics()` is the advanced
engine: named presets, timed `playPattern` envelopes (`{duration, points:
[{at, intensity, sharpness}]}`), gesture-driven realtime sessions
(`startRealtime()` → `{update, stop}`), and cancellation.

```sh
pnpm add @octane-xplat/haptics
```

```ts
import { createHaptics, haptics } from '@octane-xplat/haptics'

haptics.impl?.impact('medium') // simple path

const engine = createHaptics() // advanced path
if (engine.capabilities().patterns) {
	engine.playPattern({ duration: 300, points: [{ at: 0, intensity: 1 }] })
}
```

`capabilities()` reports `supported` plus `presets`, `patterns`, and
`realtime` independently — check the flag for the feature you use. Native
is backed by Pulsar: Android needs compile SDK 36+ for `com.swmansion.pulsar`
(runtime support reaches API 24) and iOS needs app-level wiring — add the
Pulsar Swift package to `ios.SPMPackages` and this package's
`platforms/ios/src/**/*.swift` to `ios.NativeSource` in the app's
NativeScript config. Web maps onto the Vibration API, which many desktop
browsers expose but ignore.

Guide: [Media services](../../docs/media-services.md); per-target
availability: [platform notes](../../docs/platform-notes.md).
