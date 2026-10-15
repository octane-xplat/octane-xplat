# ScrollableArea ref is a typed handle; ref composition preserves every ref

`ScrollableArea`'s `ref` now receives a `ScrollableAreaHandle` instead of the
raw scroll element/view: `scrollToOffset({ inline, block }, { animated })`
scrolls each logical axis to an absolute offset (px on web, dips on
iOS/Android, points on macOS, clamped to the scrollable range), and `native`
exposes the platform scroll viewport (`HTMLElement` / NativeScript
`ScrollView` / AppKit `NSScrollView`) as the explicit escape hatch. Calls
before the viewport mounts are no-ops; the handle clears on unmount.

`VirtualListHandle` gained the same `native` field, matching `WebViewHandle`
and the input handles. `mergeProps` now composes `ref` values like React
Aria's — merging two prop bags that each carry a ref no longer drops the
earlier consumer's ref.

Migrating: where a `ScrollableArea` ref was used as the host view, read
`ref.current?.native` instead — for example `area.current?.native.scrollTop`
on web. `VirtualList` and `WebView` ref call sites are unchanged.
