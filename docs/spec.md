# xplat at a glance

> Decide whether xplat fits your app, then find the smallest set of ideas you
> need before writing a screen.

## What xplat is

xplat lets one TypeScript app target the browser, iOS, and Android. You write
shared screens and use the same small set of UI components on every platform.
When a platform truly needs different behavior, the framework chooses a
platform-specific file for you.

The goal is not to make the platforms identical. The goal is to keep your
product code shared while leaving room for the browser and native app to feel
like themselves.

## The useful mental model

Think in three layers:

1. **Screens** describe what the user sees and does.
2. **UI components** provide the shared vocabulary: `View`, `Text`, `Row`,
   `Pressable`, `List`, inputs, overlays, and navigation shells.
3. **Platform services** handle things that differ, such as storage,
   permissions, haptics, and the app lifecycle.

Most application code stays in the first layer. You only reach for a platform
leaf when a platform service or visual behavior genuinely differs.

## A small screen

```tsx
import { View, Text, Pressable } from '@octane-xplat/ui'

export function Welcome() {
	return (
		<View className="screen">
			<Text className="title">Welcome</Text>
			<Pressable className="button" onPress={() => console.log('hello')}>
				<Text>Continue</Text>
			</Pressable>
		</View>
	)
}
```

The screen uses shared components. The web build renders them for the DOM; the
native build renders them for NativeScript.

## Start here

- [Building screens](primitives.md)
- [Styling screens](styling.md)
- [Moving between screens](navigation.md)
- [Using device features](platform-services.md)
- [Running and checking an app](toolchain.md)

The [framework notes](framework-notes.md) keep the compiler model, decisions,
and risk register for people extending xplat itself.
