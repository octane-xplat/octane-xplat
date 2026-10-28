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

export function Preview() {
	return (
		<Video
			src="https://example.com/clip.mp4"
			controls
			fit="contain"
			onReady={(event) => console.log(event.duration)}
			onEnded={() => console.log('Done')}
		/>
	)
}
```

All times are milliseconds on every platform. `onError` is web-only — the
plugin players surface no error event on native. `handle.native` is the
platform surface for anything the shared props don't cover, and the
`ios`/`android`/`web` escape props apply after the shared props.

```tsx
// Player.web.tsx — this failure callback and escape bag are browser-specific.
import { Video } from '@octane-xplat/video'

export function Player() {
	return (
		<Video
			src="https://example.com/clip.mp4"
			web={{ preload: 'metadata' }}
			onError={(event) => console.log(event.message)}
			ref={(handle) => {
				console.log(handle.duration(), handle.native)
				handle.seekTo(1000)
			}}
		/>
	)
}
```

Per-target limits are recorded in
[known limits](https://octane-xplat.goddardai.org/known-limits). Exercised by
[`VideoDemo`](https://github.com/octane-xplat/octane-xplat/blob/main/packages/demos/src/VideoDemo.tsrx).
