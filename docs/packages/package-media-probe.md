# `@xplat/media-probe`

> Repository role and usage for @xplat/media-probe.

A standalone probe package for the media plugin seams — private, not a
dependency of the harness app. It exercises the underlying NativeScript
plugins directly (`@nativescript-community/audio` for the player,
`@nativescript/audio-context` for sounds, Pulsar for haptics) so plugin
behavior can be investigated apart from the `@octane-xplat/{audio,sounds,
haptics}` wrappers.

```ts
import {
  playPreset,
  playCustomPattern,
  setRealtime,
  stopRealtime,
  playUiTone,
  stopUiTones,
  createAudioPlayer,
} from '@xplat/media-probe'
```

The package is plugin-shaped: `platforms/{ios,android}` carries the plugin
wiring. iOS keeps the `XplatPulsarBridge` Swift sources; Android needs no
helper — `include.gradle` puts `com.swmansion.pulsar` on the app classpath
and `src/haptics.ts` calls the Java-visible SDK directly. Keep it for
targeted plugin probing — anything it proves belongs in the leaf packages
before it reaches an app.
