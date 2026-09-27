# Motion and gestures

> Describe the interaction the user should feel, then let each target handle
> the mechanics.

## Animate a value

Use `useAnimation` for a value that changes over time. The value exposes a
normal destination animation and a spring:

```tsx
import { View, Text, Pressable, useAnimation } from '@octane-xplat/ui'

export function Mover() {
	const x = useAnimation(0)

	return (
		<View bind={(element) => x.bind(element)}>
			<Pressable onPress={() => x.to(120, { duration: 180 })}>
				<Text>Move</Text>
			</Pressable>
		</View>
	)
}
```

Use a spring (`x.spring(target, { damping, stiffness })`) when the motion
should settle naturally. Stop or replace an animation when the screen is
leaving so old work cannot update a removed view.

## Handle gestures as events

Gesture callbacks should update the visual value during the gesture and keep
product state for the final result. Do not make every pointer or touch move a
full screen state update.

Use shared gesture props such as `onPan` and `onSwipe` — `View`, `Row`,
and `Pressable` all accept them, plus `bind` to reach the host view. The
web and native leaves normalize their event payloads so the screen can
respond to movement, velocity, and direction without knowing the input
system.

Write per-frame movement imperatively through `setTranslate(boundView, x,
y)` — or an `useAnimation` value when the move also needs a tween — and
commit the state change once, at gesture end. The Reorder demo
(`packages/demos/src/Reorder.tsrx`) is the reference shape.

Native gesture velocity is normalized to dip per second on both platforms.

For the timing model, supported gesture payloads, and target-specific limits,
see the [animation notes](animation-notes.md).
