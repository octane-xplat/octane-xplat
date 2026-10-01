# `@octane-xplat/video`

Embedded video player for Octane xplat apps: `<video>` on web and
`@nstudio/nativescript-exoplayer` on native (ExoPlayer on Android,
`AVPlayerViewController` on iOS), with a macOS entry. The OS engine owns
the pixels while all chrome is self-drawn, so `controls` looks identical
on every target.

```sh
pnpm add @octane-xplat/video
```

```tsx
import { Video } from '@octane-xplat/video'

;<Video
	src="https://example.com/clip.mp4" // native also accepts ~/ bundle paths and files
	poster="https://example.com/poster.jpg"
	controls // self-drawn transport, default true
	fit="contain" // 'contain' | 'cover' | 'fill'
	muted // pair with autoPlay — browsers block unmuted autoplay
	playing={isPlaying} // controlled — pair with onPlayingChange, or omit
	onReady={(e) => console.log(e.duration)}
	onEnded={() => console.log('done')}
	bind={(h) => (handle = h)} // play/pause/seekTo(ms)/currentTime/duration + .native
/>
```

All times are milliseconds on every platform. `onError` is web-only — the
plugin players surface no error event on native. `bind.native` is the
platform surface for anything the shared props don't cover, and the
`ios`/`android`/`web` escape props apply after the shared props.

Per-target limits are recorded in
[known limits](../../docs/known-limits.md). Exercised by
[`VideoDemo`](../demos/src/VideoDemo.tsrx).
