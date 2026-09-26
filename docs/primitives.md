# Building screens

> Compose a screen from a small shared vocabulary, then let each platform
> render that vocabulary in its own way.

## The components you reach for first

| Need                                   | Component                       |
| -------------------------------------- | ------------------------------- |
| Group content                          | `View`                          |
| Put items in a row                     | `Row`                           |
| Show text                              | `Text`                          |
| Compose styled or tappable inline text | `RichText` + `RichTextSpan`     |
| Respond to a tap                       | `Pressable`                     |
| Render repeated items                  | `ScrollView` + `items.map(...)` |
| Accept one or more lines               | `TextInput`, `TextArea`         |
| Scroll content                         | `ScrollView`, `ScrollBox`       |
| Show temporary content above a screen  | `Sheet`, `Overlay`              |

Start with these components. They are deliberately smaller than the browser
DOM or the full NativeScript view catalog, which makes a shared screen easier
to keep portable — and they are self-drawn or chrome-reset, so the same props
produce the same pixels on every target.

Platform-authentic widgets (real OS chrome, no parity promised) live behind
`@octane-xplat/ui/ios`, `@octane-xplat/ui/android`, and `@octane-xplat/ui/web`
under their OS names — `UITableView`, `RecyclerView`, `UIModal`,
`MaterialDialog`, `UITabBar`, `BottomNavigationView`, `SideDrawer`,
`DrawerLayout`, `UISwitch`, `MaterialSwitch`, `UISlider`, `SeekBar`,
`UIActivityIndicatorView`, `CircularProgressIndicator`, `LiquidGlass` +
`LiquidGlassContainer` (iOS-only), and `Hoverable` (web-only). Import them
only from `.ios.*`/`.android.*`/`.web.*` files — a shared `.tsrx` importing a
platform subpath fails the other platform's build, which is the point.

## A practical example

```tsx
import { View, Text, Pressable } from '@octane-xplat/ui'

export function EmptyState() {
	return (
		<View className="empty-state">
			<Text>No messages yet.</Text>
			<Pressable onPress={() => console.log('create message')} className="button">
				<Text>Write a message</Text>
			</Pressable>
		</View>
	)
}
```

Use `className` for reusable visual styles, `style` for values that change at
runtime, and shared event names such as `onPress` and `onChange`.

`TextArea` keeps Return as a newline. On web, `onSubmit` fires for
Cmd/Ctrl+Enter. On native, `onSubmit` is enabled only when
`returnKeyType="done"` or `returnKeyType="send"`; NativeScript's TextView
otherwise reports every newline as `returnPress`.
_Verified with real keyboard input on the iOS simulator._

`Pressable` and `Text` share the accessibility props in the platform map,
including `accessible`, label, hint, value, role, state, and live region. Role
names stay portable; the native leaf translates names such as `heading` to
NativeScript's `header`. _Wired on both targets; on-device reading pending._

For mixed formatting or inline links, compose `RichText` with
`RichTextSpan` children. Each span can carry its own `className`, `style`, and
`onPress`; the native leaf maps the runs to NativeScript `FormattedString`
spans and uses the span's `text` prop for driver compatibility.
_Span taps verified on the iOS simulator._

## When a screen needs more

For repeated content in shared code, render `items.map(...)` inside a
`ScrollView` — the shared surface has no recycled list. Recycling is
platform-authentic: `UITableView` (`ui/ios`) and `RecyclerView`
(`ui/android`) carry it. On native, a platform list must not sit inside a
`ScrollView` — NativeScript measures a vertical `ScrollView` child without
a bounded height, which makes the nested list prepare cells through an
unsupported path; the list leaf throws a named error on that nesting. Wrap
the list in `ScrollBox` (a real `ScrollView` on web, an inline `View` on
native) so the list owns scrolling.
_Verified on the iOS simulator._

Use `Sheet` for a focused interruption, or `openSheet`/`showToast`/`Overlay`
imperatively, and pass the data it needs as props. The platform's own
modal presentation is `UIModal`/`MaterialDialog` + `openModal` in the
subpaths — there is no shared `Modal`.

`Hoverable` (delayed hover card) is web-only at `@octane-xplat/ui/web`.
Touch platforms have no hover semantic; the old native long-press
stand-in was fake parity and is gone.

Use `useMeasure()` when a screen needs live element bounds:
`const { bind, bounds } = useMeasure()`, then pass `bind` to a primitive's
`bind` prop. Bounds are observed by default and are `null` before the element
has a usable layout. Web coordinates are viewport-relative; native coordinates
are screen-relative device-independent pixels. Set `{ observe: false }` for a
single read after binding.

`showToast()` keeps top/bottom viewport placement and adds start/end alignment.
Pass `anchor` plus an optional `placement` to position a toast from a view;
that anchored form follows `Popover`'s platform-specific overlay behavior.

If a component needs different markup on web and native, keep its public props
shared and split only its leaves. The [primitive notes](primitive-notes.md)
cover the less common components, accessibility details, and renderer limits.
