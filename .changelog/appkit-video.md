### Embedded video source support on AppKit

Experimental AppKit Video now has an AVPlayerLayer surface with shared playback
controls, posters, mute, loop and millisecond seek commands. Rebuild the native
host after adding the package. Native compilation, playback and packaged-consumer
qualification are still pending.

```tsx
import { Video } from '@octane-xplat/video'
export function Clip({ source }: { source: string }) {
	return <Video src={source} controls style={{ width: 320, height: 220 }}
		onError={({ message }) => console.warn(message)} />
}
```

AppKit reports generic errors; mobile plugin errors remain unavailable. Lightbox
video is separate. See the [video guide](https://octane-xplat.goddardai.org/app/primitives#video-playback)
and [AppKit subset](https://github.com/octane-xplat/octane-xplat/tree/main/packages/video#experimental-appkit-playback).
