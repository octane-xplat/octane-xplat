# @octane-xplat/intersection-observer

Cross-platform visibility tracking for Octane xplat, mirroring the DOM
`IntersectionObserver` contract as closely as each target allows.

```tsx
import { useIntersectionObserver } from '@octane-xplat/intersection-observer'
import { View, Text } from '@octane-xplat/ui'

export function VisibilityStatus() {
	const observer = useIntersectionObserver()
	return (
		<View ref={observer.ref}>
			<Text>{observer.isIntersecting ? 'Visible' : 'Not visible'}</Text>
		</View>
	)
}
```

- **web** — the DOM `IntersectionObserver`, re-exported under the shared
  types. Behavior is exactly the browser's.
- **iOS / Android** — one shared NativeScript implementation. There is no
  platform observer, so geometry is measured in screen-space dips
  (`getLocationOnScreen()` + `getActualSize()`) and re-evaluated on
  `scroll` events and `layoutChanged` up the ancestor chain — the approach
  [`@nativescript-use/nativescript-intersection-observer`](https://github.com/NativeScript-Use/NativeScript-Use)
  applies to a single ScrollView, generalized to every ancestor plus
  `threshold`/`rootMargin` support.
- **macOS** — an AppKit implementation measures NSView geometry in top-left
  window-content coordinates, clips against enclosing `NSClipView`s and the
  optional root, and re-evaluates on scroll bounds and view frame notifications.

## API

```ts
import {
	IntersectionObserver,
	supported,
	useIntersectionObserver,
} from '@octane-xplat/intersection-observer'
```

### Imperative

```ts
import { IntersectionObserver } from '@octane-xplat/intersection-observer'

// Call with the actual host view/element supplied by your component binding.
export function watchTarget(target: unknown, root: unknown = null) {
	const observer = new IntersectionObserver(
		(entries) => {
			for (const entry of entries) console.log(entry.isIntersecting, entry.intersectionRatio)
		},
		{ root, rootMargin: '10% 0px', threshold: [0, 0.5, 1] },
	)
	observer.observe(target)
	return () => {
		observer.takeRecords()
		observer.unobserve(target)
		observer.disconnect()
	}
}
```

`root` is an `Element` on web, a NativeScript `View` on iOS/Android, or an
AppKit `NSView` on macOS. `null`/`undefined` means the viewport (the screen on
iOS/Android and the window content area on macOS).
`rootMargin` accepts CSS-style `px` (dips on iOS/Android, points on macOS) or
`%` values. Percentages resolve against the root width on every side, matching
the web contract.

### Hook

```tsx
import { ScrollableArea, View, Text } from '@octane-xplat/ui'
import { useIntersectionObserver } from '@octane-xplat/intersection-observer'

export function VisibleRow() {
	const { ref, rootRef, entry, isIntersecting } = useIntersectionObserver({
		threshold: 0.5,
		onChange: (entry) => console.log(entry.isIntersecting),
	})
	return (
		<ScrollableArea ref={rootRef}>
			<View ref={ref}>
				<Text>{isIntersecting ? 'Visible' : 'Outside viewport'}</Text>
			</View>
			<Text>{entry?.intersectionRatio ?? 0}</Text>
		</ScrollableArea>
	)
}
```

`ref`/`rootRef` attach to a component's `ref` prop. `options.root` takes
precedence over a `rootRef`-bound container. `entry` is the latest
delivered entry (`null` before the first notification); `isIntersecting`
mirrors `entry.isIntersecting`.

### Platform support

`supported` is `true` in browsers with the DOM API and on iOS, Android, and
macOS. On non-DOM web hosts it is `false`; the exported observer is inert and
does not deliver entries.

```ts
import { supported } from '@octane-xplat/intersection-observer'

if (!supported) console.log('Visibility tracking is unavailable on this host')
```

## Native behavior notes

- After a `scroll` or `layoutChanged` event, the callback is queued with
  `setTimeout(0)`; it is not deferred to a frame task like the DOM.
- Ancestors that clip on both platforms (`ScrollView`, `ListView`) clip the
  measured rect automatically. Other scrollable plugin containers are not
  enumerable; pass the scroller as `root` so its bounds bound the result.
- macOS uses top-left window-content coordinates (points), observes scroll
  changes on enclosing `NSClipView`s, and uses the window content area as the
  viewport when no root is supplied.
- A target that never lays out produces no initial entry until geometry
  exists (DOM parity: no notification before layout).
- `entry.time` is `Date.now()`, not a `DOMHighResTimeStamp`.
- Programmatic geometry: transforms applied purely by animation do not
  emit events and will not re-evaluate until the next event.
