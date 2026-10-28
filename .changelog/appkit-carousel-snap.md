### AppKit carousel snap source support

Carousel now requests the nearest slide edge after native user scrolling settles.
Live tracking waits for an end notification; unbracketed user updates use a quiet
period. Programmatic animations do not arm another snap, and new requests or
teardown cancel pending work.

```tsx
import { Carousel, Text } from '@octane-xplat/ui'

export function Previews() {
	return <Carousel label="Previews" hasSnap variant="proportional" style={{ width: 320, height: 120 }}>
		<Text>First</Text><Text>Second</Text>
	</Carousel>
}
```

Native input/momentum, layout/RTL, animation/accessibility and packaging remain
unqualified. Edge fades remain a gap. See [AppKit snap](https://octane-xplat.goddardai.org/app/components#snap-appkit-carousel-slides-after-user-scrolling).
