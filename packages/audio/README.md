# `@octane-xplat/audio`

```sh
pnpm add @octane-xplat/audio
```

Long-form audio playback for Octane xplat apps — a queue player, not a
sound-effect bank. iOS uses `AVPlayer`/`AVAudioSession` (interruption
handling included) and Android uses a package-owned Media3 playback service.
macOS uses a package-owned AVPlayer bridge. Web uses an
`HTMLAudioElement` plus the Media Session API for system controls.

```ts
import { createAudioPlayer } from '@octane-xplat/audio'

const player = createAudioPlayer()
await player.setQueue([{ id: 'ep1', source: 'https://example.com/ep1.mp3' }])
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

For short UI sounds use [`@octane-xplat/sounds`](../sounds/README.md).

Guide: [Media services](../../docs/platform/media-services.md); per-target
availability: [platform notes](../../docs/notes/platform-notes.md). Exercised by
the harness `MediaServices` screen
([`packages/app/src/MediaServices.tsrx`](../app/src/MediaServices.tsrx)).
