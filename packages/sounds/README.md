# `@octane-xplat/sounds`

```sh
pnpm add @octane-xplat/sounds
```

Short UI sound effects for Octane xplat apps — tap blips, confirmations,
alerts — not long-form playback. iOS/Android decode and mix through
`@nativescript/audio-context` (a Web Audio port); web pools cloned
`HTMLAudioElement` voices.

```ts
import { createSoundBank } from '@octane-xplat/sounds'

const bank = createSoundBank({ maxVoices: 8 })
await bank.load('confirm', { uri: 'https://example.com/confirm.mp3' })
await bank.play('confirm', { volume: 0.8 })
```

`load(name, source)` prepares the clip before playback; native decodes it up
front, while browsers may defer audio data until `play`. `stop(name?)` ends one
voice or all. `capabilities()` reports `supported`,
`userGestureRequired` (web autoplay policy can refuse the first `play`,
which resolves `false`), and `maxVoices` — check it before relying on
polyphony.

```ts
// Continue with the loaded bank above; play from a user action on web.
console.log(bank.capabilities().maxVoices)
const played = await bank.play('confirm')
if (!played) console.log('Playback was unavailable or blocked')
bank.stop('confirm')
bank.stop()
bank.dispose()
```

For queued music/podcast playback use
[`@octane-xplat/audio`](../audio/README.md); for tactile feedback use
[`@octane-xplat/haptics`](../haptics/README.md).

Guide: [Media services](../../docs/platform/media-services.md); per-target
availability: [platform notes](../../docs/notes/platform-notes.md).
