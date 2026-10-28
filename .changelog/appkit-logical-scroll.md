### Logical AppKit scroll offsets

ScrollableArea now follows InternationalizationProvider direction for inline
seeks, start/end state and inline padding. In RTL, inline zero means the right
edge; direction changes keep the handle stable and remeasure state.

```tsx
import { InternationalizationProvider, ScrollableArea, Text } from '@octane-xplat/ui'

export function Notes() {
	return <InternationalizationProvider dir="rtl">
		<ScrollableArea axis="inline" width={240} height={80} paddingInlineStart={2}>
			<Text>Notes</Text>
		</ScrollableArea>
	</InternationalizationProvider>
}
```

Native content ordering, initial clip position, OS scrolling and animation
remain unqualified. See [logical scrolling](https://octane-xplat.goddardai.org/app/primitives#logical-scroll-offsets-on-appkit).
