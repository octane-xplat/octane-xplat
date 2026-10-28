# `@octane-xplat/sounds`

Short UI sound effects for Octane xplat apps — tap blips, confirmations,
alerts — not long-form playback. iOS/Android decode and mix through
`@nativescript/audio-context` (a Web Audio port); web pools cloned
`HTMLAudioElement` voices. macOS AppKit uses a separate `AVAudioPlayer` for each
voice and reuses the loaded bytes.

```sh
pnpm add @octane-xplat/sounds
```

```ts
import { createSoundBank } from '@octane-xplat/sounds'

const bank = createSoundBank({ maxVoices: 8 })
await bank.load('confirm', { uri: 'https://example.com/confirm.mp3' })
await bank.play('confirm', { volume: 0.8 })
```

`load(name, source)` prepares the clip before playback; iOS/Android decode it up
front, macOS validates local files or downloaded HTTP(S) bytes, and browsers may
defer audio data until `play`. `stop(name)` ends every voice for that name;
`stop()` ends all effects. At the voice limit, the oldest active voice is stopped
before the next begins. `capabilities()` reports `supported`,
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
[`@octane-xplat/audio`](https://github.com/octane-xplat/octane-xplat/blob/main/packages/audio/README.md); for tactile feedback use
[`@octane-xplat/haptics`](https://github.com/octane-xplat/octane-xplat/blob/main/packages/haptics/README.md).

Guide: [Media services](https://octane-xplat.goddardai.org/media-services); per-target
availability: [platform notes](https://github.com/octane-xplat/octane-xplat/blob/main/.agents/docs/notes/platform-notes.md).

macOS requires the AppKit host's Foundation and AVFoundation APIs. Without them,
construction is safe, capabilities report unsupported, loads reject, and plays
resolve `false`. Disposal cancels pending macOS downloads. Audible output and
coexistence with long-form playback remain separate qualification checks.

```ts
import { createSoundBank } from '@octane-xplat/sounds'

const effects = createSoundBank()
if (!effects.capabilities().supported) console.log('UI sounds unavailable')
effects.dispose()
```
