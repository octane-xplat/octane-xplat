# `@octane-xplat/audio`

Long-form audio playback for Octane xplat apps — a queue player, not a
sound-effect bank. iOS uses `AVPlayer`/`AVAudioSession` (interruption
handling included) and Android uses a package-owned Media3 playback service.
macOS uses a package-owned AVPlayer bridge. Web uses an
`HTMLAudioElement` plus the Media Session API for system controls.

```sh
pnpm add @octane-xplat/audio
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

For short UI sounds use [`@octane-xplat/sounds`](https://github.com/octane-xplat/octane-xplat/blob/main/packages/sounds/README.md).

Guide: [Media services](https://octane-xplat.goddardai.org/media-services); per-target
availability: [platform notes](https://github.com/octane-xplat/octane-xplat/blob/main/.agents/docs/notes/platform-notes.md). Exercised by
the harness `MediaServices` screen
([`packages/app/src/MediaServices.tsrx`](https://github.com/octane-xplat/octane-xplat/blob/main/packages/app/src/MediaServices.tsrx)).

## Foreground verification

The maintained silent-WAV fixture measures observable player state against
fixed budgets. Run it on an owned build host and iOS simulator (or Android
emulator with `--target android`). Its local HTTP addresses target virtual
devices; physical media acceptance needs a reachable server and a separate run:

```sh
pnpm exec turbo run test:browser --filter=@octane-xplat/audio -- --foreground-budgets
pnpm exec turbo run test:runtime --filter=@octane-xplat/audio -- --foreground-budgets --target ios --device OWNED_UDID
pnpm exec turbo run test:macos-budgets --filter=@octane-xplat/audio
```

| Measurement | Fixture ceiling |
| --- | --- |
| First observed progress after loading | 10 seconds |
| Preserving queue update | 250 milliseconds |
| Position lost during that update | 0.15 seconds |
| Observable seek position | 1.5 seconds |
| Estimated extra boundary delay | 1.5 seconds |
| Appended waiting queue resumes | 2 seconds |
| Sampled AppKit host peak RSS | 384 MiB |

These are initial fixture ceilings, not application performance guarantees.
Boundary timing comes from media positions and polling; it does not measure
an audible gap. RSS samples cover the owned AppKit process, excluding GPU and
other processes. Startup, leaks, durable progress, background execution and
physical output need separate acceptance. The
[packed listening/settings check](https://github.com/octane-xplat/octane-xplat/blob/main/tools/native-readiness/README.md)
exercises these services together in an external mobile consumer.
