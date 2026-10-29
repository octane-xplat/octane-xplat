# `@octane-xplat/video`

Embedded video player for Octane xplat apps: `<video>` on web and
`@nstudio/nativescript-exoplayer` on native (ExoPlayer on Android,
`AVPlayerViewController` on iOS). Experimental AppKit now has an
AVPlayerLayer source implementation backed by the package's own Swift view. The OS engine owns
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

All times are milliseconds on every platform. `onError` is available on web
and the experimental AppKit path; iOS/Android plugin players surface no error event. `handle.native` is the
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



## Experimental AppKit playback

Rebuild the AppKit app after adding this package so the CLI includes its Swift
view and system frameworks. No additional player dependency is needed for
AppKit. Missing native bridge setup fails explicitly before mounting. Use a
bounded frame and HTTP(S), an absolute file, a file URL, or a ~/ path relative
to the app bundle's resources. Empty source stays idle. Native compilation,
codecs, sandbox access, rendering and packaging have not yet been qualified.

```tsx
import { Video } from '@octane-xplat/video'
export function Preview({ source }: { source: string }) {
	return <Video src={source} style={{ width: 320, height: 220 }} controls
		fit="contain" onReady={({ duration }) => console.log(duration)}
		onError={({ message }) => console.warn(message)} />
}
```

The AppKit source path uses the shared self-drawn transport, including poster,
play/pause, seek, mute, loop and contain/cover/fill. Source replacements retire
old notifications, timers and seek completions. The stable handle reads the
current view; disposal makes its commands inert. Explicit play retries a failed
source; rerendering the same props does not. Before metadata, the last finite
seek request waits for readiness. Unknown/live duration reads as zero.

```tsx
import { useRef } from 'octane'
import { Button } from '@octane-xplat/ui'
import { Video, type VideoHandle } from '@octane-xplat/video'
export function Clip({ source }: { source: string }) {
	const player = useRef<VideoHandle | null>(null)
	return <>
		<Video ref={player} src={source} style={{ width: 320, height: 220 }} />
		<Button label="Play / retry" clickAction={() => player.current?.play()} />
		<Button label="Seek to one second" clickAction={() => player.current?.seekTo(1000)} />
	</>
}
```

Callbacks use current source ownership and current handlers. onReady reports
metadata once per attempt, not a decoded-frame proof. onPlayingChange describes
accepted play intent, not buffering progress; autoPlay initializes each source,
and controlled playing prop changes drive it. Looping suppresses onEnded.
AppKit errors are generic and omit source URLs/NSError details; consumer callback
exceptions are reported separately. Polling runs every 250 ms while loading,
playing or seeking. Paused ready playback polls once per second only when an
error callback is installed; other paused playback stops polling. Removing a
previously attached native view pauses it; remount or issue a new play request
to resume. Per-platform ios/android/web escape bags do not apply to AppKit.

```tsx
import { useState } from 'octane'
import { Video } from '@octane-xplat/video'
export function ControlledClip({ source }: { source: string }) {
	const [playing, setPlaying] = useState(false)
	return <Video src={source} playing={playing} onPlayingChange={setPlaying}
		loop muted style={{ width: 320, height: 220 }} />
}
```

Nine owner cases and the [AppKit fixture](../../examples/probes/video.macos.tsrx)
are authored but unrun. Packed-consumer source checks now require the Swift
source/configuration to ship, but packing has not run. Actual bridge discovery,
Swift compilation, frame/audio playback, seeking/looping, notification/thread
behavior, input/AX, fit/resize, memory/power and packaged consumers remain
unqualified. DRM, subtitles, background playback and full streaming support are
not established by this source implementation. Lightbox video integration is
still separate; this leaf does not qualify it.
