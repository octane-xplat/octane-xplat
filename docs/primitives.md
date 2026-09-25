# Building screens

> Compose a screen from a small shared vocabulary, then let each platform
> render that vocabulary in its own way.

## The components you reach for first

| Need                                  | Component               |
| ------------------------------------- | ----------------------- |
| Group content                         | `View`                  |
| Put items in a row                    | `Row`                   |
| Show text                             | `Text`                  |
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

If a component needs different markup on web and native, keep its public props
shared and split only its leaves. The [primitive notes](primitive-notes.md)
cover the less common components, accessibility details, and renderer limits.
