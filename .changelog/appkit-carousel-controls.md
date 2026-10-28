### AppKit carousel navigation source support

Carousel now provides its handle and Previous/Next controls on AppKit, with
viewport paging, indexed slide alignment and end wrapping. Proportional slides
use measured viewport widths. Requests preserve vertical scrolling and honor
reported reduced motion.

```tsx
import { Carousel, Text } from '@octane-xplat/ui'

export function Previews() {
	return <Carousel label="Previews" hasButtons hasLoop variant="proportional" style={{ width: 320, height: 120 }}>
		<Text>First</Text><Text>Second</Text>
	</Carousel>
}
```

Native layout/RTL, scroll/input, button hit testing/accessibility and packaging
remain unqualified. Snap and edge fades remain gaps. See [AppKit carousel navigation](https://octane-xplat.goddardai.org/app/components#navigate-appkit-carousel-slides).
