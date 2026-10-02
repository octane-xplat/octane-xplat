# `@octane-xplat/audio`

```sh
pnpm add @octane-xplat/audio
```

Long-form audio playback for Octane xplat apps — a queue player, not a
sound-effect bank. iOS drives `AVPlayer`/`AVAudioSession` (interruption
handling included) and Android `MediaPlayer`, both directly on
`@nativescript/core` with no plugin dependency; web drives an
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

The `capabilities()` report is the honest part: `supported`,
`backgroundPlayback`, `systemControls`, `userGestureRequired`, and
`interruptions` vary by target and runtime state, so check them before
promising behavior like lock-screen controls. The native entry requires
iOS or Android — other targets get the web implementation or a thrown
error, never a silent no-op.

```ts
// Continue with the player created above.
const capabilities = player.capabilities()
console.log(capabilities.backgroundPlayback, capabilities.systemControls)
off()
player.dispose()
```

For short UI sounds use [`@octane-xplat/sounds`](../sounds/README.md).

Guide: [Media services](../../docs/platform/media-services.md); per-target
availability: [platform notes](../../docs/notes/platform-notes.md). Exercised by
the harness `MediaServices` screen
([`packages/app/src/MediaServices.tsrx`](../app/src/MediaServices.tsrx)).
