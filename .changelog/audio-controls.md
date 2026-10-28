### Control speech playback and update growing queues

Audio queues now expose pitch-preserving playback speed, volume, and mute on
web, iOS, Android, and experimental macOS. Settings survive source changes;
muting retains the selected volume. Append future items without restarting a
matching current track; incomplete queues distinguish waiting from completion.

```ts
import { createAudioPlayer } from '@octane-xplat/audio'
const player = createAudioPlayer()
await player.setPlaybackRate(1.5)
await player.setVolume(0.4)
await player.setMuted(true)
const first = { id: '1', source: 'https://example.com/1.mp3' }
await player.setQueue([first], 0, { complete: false })
await player.updateQueue([first, { id: '2', source: 'https://example.com/2.mp3' }], { complete: true })
player.dispose()
```

[Audio documentation](https://octane-xplat.goddardai.org/media-services#playback-speed-and-volume)
