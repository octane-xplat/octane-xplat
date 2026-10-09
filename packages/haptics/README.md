# `@octane-xplat/haptics`

```sh
pnpm add @octane-xplat/haptics
```

Haptic feedback for Octane xplat apps, in two layers. The `haptics`
service mirrors the platform contract — `impact(style)`,
`notification(kind)`, `selection()`. `createHaptics()` is the advanced
engine: named presets, timed `playPattern` envelopes (`{duration, points:
[{at, intensity, sharpness}]}`), gesture-driven realtime sessions
(`startRealtime()` → `{update, stop}`), and cancellation.

```ts
import { createHaptics, haptics } from '@octane-xplat/haptics'

if ((await haptics.ensure()) === 'granted') {
	haptics.impl!.impact('medium') // simple path
	haptics.impl!.notification('success')
}

const engine = createHaptics() // advanced path
if (engine.capabilities().presets) engine.play('success')
if (engine.capabilities().patterns) {
	engine.playPattern({ duration: 300, points: [{ at: 0, intensity: 1 }] })
}
engine.dispose()
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
```

Native is backed by Pulsar: Android needs compile SDK 36+ for
`com.swmansion.pulsar` (runtime support reaches API 24) and iOS needs
app-level wiring — add the Pulsar Swift package to `ios.SPMPackages` and
this package's `platforms/ios/src/**/*.swift` to `ios.NativeSource` in
the app's NativeScript config. Web maps onto the Vibration API, which
many desktop browsers expose but ignore.

Guide: [Media services](../../docs/platform/media-services.md); per-target
availability: [platform notes](../../docs/notes/platform-notes.md).
