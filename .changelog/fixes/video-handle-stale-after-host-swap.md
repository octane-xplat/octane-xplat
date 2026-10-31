### Keep `VideoHandle` bound to the live player after view replacement

The imperative handle returned through `Video`'s `ref` now resolves the current
native view on every call instead of capturing the view that was attached when
the handle was created. Previously, if the element's host view was replaced
without the handle effect re-running — for example a keyed swap that recreates
the player — `play`, `pause`, `seekTo`, `currentTime`, `duration`, and `native`
kept describing the outgoing clip.

```tsx
const ref = useRef<VideoHandle | null>(null)

// ref.current now always talks to the mounted player, whichever clip is live.
<Video key={clip.id} src={clip.uri} ref={ref} autoPlay
	onEnded={() => setClip(nextClip)} />
```

Applies to web, iOS, and Android. See
[Video setup and props](https://github.com/octane-xplat/octane-xplat/blob/main/docs/app/primitives.md#video-playback).
