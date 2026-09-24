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
| Scroll content                        | `ScrollView`            |
| Show temporary content above a screen | `Modal`                 |

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
sequence. Use `Modal` for a focused interruption, and pass the data it needs
as props.

If a component needs different markup on web and native, keep its public props
shared and split only its leaves. The [primitive notes](primitive-notes.md)
cover the less common components, accessibility details, and renderer limits.
