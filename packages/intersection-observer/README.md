# @octane-xplat/intersection-observer

Cross-platform visibility tracking for Octane xplat, mirroring the DOM
`IntersectionObserver` contract as closely as each target allows.

- **web** — the DOM `IntersectionObserver`, re-exported under the shared
  types. Behavior is exactly the browser's.
- **iOS / Android** — one shared NativeScript implementation. There is no
  platform observer, so geometry is measured in screen-space dips
  (`getLocationOnScreen()` + `getActualSize()`) and re-evaluated on
  `scroll` events and `layoutChanged` up the ancestor chain — the approach
  [`@nativescript-use/nativescript-intersection-observer`](https://github.com/NativeScript-Use/NativeScript-Use)
  applies to a single ScrollView, generalized to every ancestor plus
  `threshold`/`rootMargin` support.

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
const observer = new IntersectionObserver(
	(entries, self) => {
		for (const entry of entries) {
			console.log(entry.isIntersecting, entry.intersectionRatio)
		}
	},
	{ root, rootMargin: '0px', threshold: [0, 0.5, 1] },
)
observer.observe(target)   // Element on web, View on native
observer.unobserve(target)
observer.disconnect()
observer.takeRecords()
```

`root` is an `Element` on web or a NativeScript `View` on native;
`null`/`undefined` means the viewport (the screen on native).
`rootMargin` accepts CSS-style `px` (dips on native) or `%` values. Percentages
resolve against the root width on every side, matching the web contract.

### Hook

```tsx
function Row() {
	const { bind, bindRoot, entry, isIntersecting } = useIntersectionObserver({
		threshold: 0.5,
		onChange: (entry) => console.log(entry.isIntersecting),
	})
	return (
		<ScrollView bind={bindRoot}>
			<View bind={bind} style={{ height: 80 }} />
		</ScrollView>
	)
}
```

`bind`/`bindRoot` attach to a component's `bind` prop. `options.root` takes
precedence over a `bindRoot`-bound container. `entry` is the latest
delivered entry (`null` before the first notification); `isIntersecting`
mirrors `entry.isIntersecting`.

### Platform support

`supported` is `true` in browsers with the DOM API and on iOS/Android. On
macOS and non-DOM web hosts it is `false`; the exported observer is inert and
does not deliver entries.

## Native behavior notes

- After a `scroll` or `layoutChanged` event, the callback is queued with
  `setTimeout(0)`; it is not deferred to a frame task like the DOM.
- Ancestors that clip on both platforms (`ScrollView`, `ListView`) clip the
  measured rect automatically. Other scrollable plugin containers are not
  enumerable; pass the scroller as `root` so its bounds bound the result.
- A target that never lays out produces no initial entry until geometry
  exists (DOM parity: no notification before layout).
- `entry.time` is `Date.now()`, not a `DOMHighResTimeStamp`.
- Programmatic geometry: transforms applied purely by animation do not
  emit events and will not re-evaluate until the next event.
