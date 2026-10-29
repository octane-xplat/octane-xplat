### Image gestures in AppKit Lightbox

Experimental AppKit Lightbox now has double-click image zoom and pointer/native
swipe navigation source paths. Zoom resets between media; swipes stop navigating
while zoomed and at gallery edges. Actual native input, hit testing, zoom
coordinates and packaged consumers remain unqualified.

```tsx
import { Lightbox } from '@octane-xplat/ui'
export function Photos({ open, setOpen, source }: {
	open: boolean; setOpen: (open: boolean) => void; source: string
}) {
	return <Lightbox isOpen={open} onOpenChange={setOpen} hasZoom media={[{ src: source, alt: 'Photo' }]} />
}
```

Lightbox retains its separate renderer-owned native video path; playback remains unqualified. See the
[AppKit presentation guide](https://octane-xplat.goddardai.org/app/primitives#macos-shared-presentations).
