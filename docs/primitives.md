# Building screens

> Compose a screen from a small shared vocabulary, then let each platform
> render that vocabulary in its own way.

## The components you reach for first

| Need                                  | Component               |
| ------------------------------------- | ----------------------- |
| Group content                         | `View`                  |
| Put items in a row                    | `Row`                   |
| Show text                             | `Text`                  |
| Compose styled or tappable inline text | `RichText` + `RichTextSpan` |
| Respond to a tap                      | `Pressable`             |
| Render repeated items                 | `List`                  |
| Accept one or more lines              | `TextInput`, `TextArea` |
| Scroll content                        | `ScrollView`, `ScrollBox` |
| Show temporary content above a screen | `Modal`                 |
| Float a glass surface (iOS 26+)       | `LiquidGlass`           |

Start with these components. They are deliberately smaller than the browser
DOM or the full NativeScript view catalog, which makes a shared screen easier
to keep portable.

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

`Pressable` and `Text` share the accessibility props in the platform map,
including `accessible`, label, hint, value, role, state, and live region. Role
names stay portable; the native leaf translates names such as `heading` to
NativeScript's `header`.

For mixed formatting or inline links, compose `RichText` with
`RichTextSpan` children. Each span can carry its own `className`, `style`, and
`onPress`; the native leaf maps the runs to NativeScript `FormattedString`
spans and uses the span's `text` prop for driver compatibility.

## When a screen needs more

Use `List` for repeated content instead of rendering a large hand-written
sequence. On native, `List` is a recycling `ListView`; do not put it inside
`ScrollView`. NativeScript measures a vertical `ScrollView` child without a
bounded height, which makes the nested list prepare cells through an unsupported
path; the native leaf also throws a named error when it detects this nesting.
Use `ScrollBox` when a shared screen needs a scroll shell around a `List`:
it is a real `ScrollView` on web and an inline `View` on native, so the `List`
owns scrolling there. `ScrollBox` does not provide an outer native scroll.

Use `Modal` for a focused interruption, and pass the data it needs as props.

Use `Hoverable` for a delayed hover card on web. On iOS and Android the same
card opens from a long press because native has no hover state; the native
driver's long-press recognizer supplies the intent threshold.

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
