# `@octane-xplat/sounds`

Short UI sound effects for Octane xplat apps — tap blips, confirmations,
alerts — not long-form playback. iOS/Android decode and mix through
`@nativescript/audio-context` (a Web Audio port); web pools cloned
`HTMLAudioElement` voices.

```sh
pnpm add @octane-xplat/sounds
```

```ts
import { createSoundBank } from '@octane-xplat/sounds'

const bank = createSoundBank({ maxVoices: 8 })
await bank.load('confirm', { uri: 'https://example.com/confirm.mp3' })
await bank.play('confirm', { volume: 0.8 })
```

`load(name, source)` decodes up front so `play` is fast; `stop(name?)`
ends one voice or all. `capabilities()` reports `supported`,
`userGestureRequired` (web autoplay policy can refuse the first `play`,
which resolves `false`), and `maxVoices` — check it before relying on
polyphony.

For queued music/podcast playback use
[`@octane-xplat/audio`](../audio/README.md); for tactile feedback use
[`@octane-xplat/haptics`](../haptics/README.md).

Guide: [Media services](../../docs/media-services.md); per-target
availability: [platform notes](../../docs/platform-notes.md).
