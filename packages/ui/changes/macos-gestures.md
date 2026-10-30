# Press and swipe callbacks on macOS

AppKit `Pressable` now forwards pan, swipe, long press, double press, and
press-in/out callbacks alongside primary press. Disabled controls suppress these
callbacks. Press cancellation reports press-out; it does not activate the control.

```tsx
import { Pressable, Text } from '@octane-xplat/ui'

export function Action() {
	return (
		<Pressable
			onPress={() => console.log('Pressed')}
			onLongPress={() => console.log('Held')}
			onDoublePress={() => console.log('Double press')}
			onPressIn={() => console.log('Down')}
			onPressOut={() => console.log('Released or cancelled')}
			onPan={(event) => console.log(event.state, event.dx, event.dy)}
			onSwipe={(event) => console.log(event.direction)}
		>
			<Text>Try an action</Text>
		</Pressable>
	)
}
```

AppKit `View` also forwards swipe. A completed mouse drag of at least 30 layout
points produces one swipe in its dominant direction: right `1`, left `2`, up `4`,
down `8`. A cancelled pan produces no swipe. Long press uses AppKit's press
recognizer with a 0.5-second minimum hold. Trackpad scroll gestures are not mapped
to swipe by this change.

```tsx
import { View, Text } from '@octane-xplat/ui'

export function SwipeArea() {
	return (
		<View onSwipe={({ direction }) => console.log('Swipe direction', direction)}>
			<Text>Drag at least 30 points, then release</Text>
		</View>
	)
}
```

The maintained AppKit fixture verifies Objective-C target dispatch, callback
payloads, cancellation, and disable/re-enable behavior. It shadows the native
read-only recognizer state for target dispatch. Physical mouse and trackpad
input, hit-testing, hold timing, and nested-control arbitration remain unverified.
Web and mobile implementations are unchanged.

```sh
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"AppKit gesture verification"}' -- bun run probe run packages/macos-renderer/test/fixtures/gestures.macos.tsrx --target macos
```
