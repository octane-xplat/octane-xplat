### Keep macOS scroll geometry updates owned and retryable

AppKit scroll geometry now releases partial and replaced observers, ignores
retired callbacks and permits later frame updates after a layout or positioning
failure. Invalid dimensions do not reach native scrolling, and a failed initial
position can be retried. Native notification, resize/scroll and installed-consumer
qualification remains pending; pull-to-refresh is still unsupported.

```tsx
import { ScrollableArea, Text } from '@octane-xplat/ui'

export function Notes({ height }: { height: number }) {
	return <ScrollableArea height={height}><Text>Trip notes</Text></ScrollableArea>
}
```

See [AppKit scrolling](https://github.com/octane-xplat/octane-xplat/blob/main/docs/app/primitives.md#macos-scrolling-and-refresh).
