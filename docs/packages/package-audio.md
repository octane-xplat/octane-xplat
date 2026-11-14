# `@octane-xplat/audio`

> Long-form audio playback for Octane xplat

Long-form audio playback for Octane xplat apps — a queue player, not a
sound-effect bank. iOS uses `AVPlayer`/`AVAudioSession` (interruption
handling included) and Android uses a package-owned Media3 playback service.
macOS uses a package-owned AVPlayer bridge. Web uses an
`HTMLAudioElement` plus the Media Session API for system controls.

```sh
bun add @octane-xplat/audio
```

```ts
import { createAudioPlayer } from '@octane-xplat/audio'

const player = createAudioPlayer()
await player.setQueue([{ id: 'ep1', source: 'https://example.com/ep1.mp3' }])
await player.setPlaybackRate(1.5)
await player.setVolume(0.4)
await player.setMuted(false)
await player.play()

const off = player.subscribe((snapshot) => {
  // { state, currentTime, duration } — poll or subscribe, your choice
})
```

Playback features vary by target and runtime state, so call
`capabilities()` before promising behavior like lock-screen controls. It
reports `supported`, `backgroundPlayback`, `systemControls`,
`userGestureRequired`, and `interruptions`. The `macos` package condition
selects the desktop bridge without importing mobile implementations. Rebuild
the macOS app after installing this package. macOS reports system controls and
interruption recovery as unavailable; a missing bridge reports `supported: false`.

```ts
// Continue with the player created above.
const capabilities = player.capabilities()
console.log(capabilities.backgroundPlayback, capabilities.systemControls)
off()
player.dispose()
```

On macOS, use an absolute local path, `file:` URL, or HTTP(S) URL. Queue
replacement rejects obsolete pending loads and stops the previous item.
Malformed media, network errors, reported output errors, and loading or
buffering stalled for 30 seconds become terminal errors. A new queue can retry;
disposal stops playback and notifications. Position, duration, and seek use
seconds. Real audible playback remains a separate qualification gate.

```ts
import { createAudioPlayer } from '@octane-xplat/audio'

export async function playTrack(source: string) {
  const player = createAudioPlayer()
  try {
    await player.setQueue([{ id: 'track', source }])
    await player.play()
    await player.seek(2.5)
    await player.pause()
  } finally {
    player.dispose()
  }
}
```

For short UI sounds use [`@octane-xplat/sounds`](https://octane-xplat.goddardai.org/package-sounds).

Native Windows selects an unavailable leaf without loading mobile backends.
Creating a player throws; this import boundary does not provide Windows playback.

```ts
import { createAudioPlayer } from '@octane-xplat/audio'

try {
  const candidate = createAudioPlayer()
  candidate.dispose()
} catch (error) {
  console.log('Audio unavailable:', String(error))
}
```

Guide: [Media services](https://octane-xplat.goddardai.org/media-services); per-target
availability: [platform notes](https://github.com/octane-xplat/octane-xplat/blob/main/.agents/docs/notes/platform-notes.md). Exercised by
the harness `MediaServices` screen
([`packages/app/src/MediaServices.tsrx`](https://github.com/octane-xplat/octane-xplat/blob/main/packages/app/src/MediaServices.tsrx)).

[Generated API reference](https://octane-xplat.goddardai.org/api-audio).

## Playback limits

Check startup, seeking, queue transitions, background behavior and audible output
on your shipping devices. Synthetic player-state measurements do not guarantee
audible gapless playback, memory use or physical output.
