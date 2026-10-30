# Imperative animation and gestures

Use for per-ref animation handles and gesture normalization. UI handles and the Motion package have distinct ownership; return to the [service index](../services.md) for other capabilities.

## Animation — `useAnimation(initial, prop)`

Returns `AnimatedValue`: `{ value, ref(el), to(target,{duration}),
spring(target,{damping,stiffness}), stop() }`.

```tsx
import { useEffect } from 'octane'
import { useAnimation, Button, View } from '@octane-xplat/ui'

export function MovingCard() {
	const x = useAnimation(0, 'translateX')
	useEffect(() => () => x.stop(), [])
	return (
		<>
			<View ref={x.ref} />
			<Button
				clickAction={() => {
					void x.to(80, { duration: 300 })
				}}
			>
				Move
			</Button>
			<Button
				clickAction={() => {
					void x.spring(0, { damping: 14, stiffness: 120 })
				}}
			>
				Return
			</Button>
		</>
	)
}
```

- `ref` is a leaf `ref` prop target — forwards to the intrinsic's `ref`,
  the tween writes the view directly (no re-render per frame).
- Web: rAF tween writes `el.style`. Native: writes the NS view property.
- Qualify animation timing and cancellation on the actual target; see
  [animation and gestures](../../../../../docs/app/animation-gestures.md) for the
  current contract rather than treating a historical harness assert as a guarantee.

For moves and resizes caused by layout, use the motion package's `layout`
prop on web, iOS, Android, and the experimental macOS host. A nested
`layout="position"` host keeps its size while its parent scales. Browser
overflow scroll offsets are detected automatically; do not add an unsupported
`layoutScroll` prop. See [layout animations](../../../../../docs/app/animation-gestures.md#layout-animations).

```tsx
import { motion } from '@octane-xplat/motion'

export function ResizingCard({ wide }: { wide: boolean }) {
	return <motion.View layout style={{ width: wide ? 240 : 120 }}>
		<motion.View layout="position" style={{ width: 50, height: 50 }} />
	</motion.View>
}
```

For moving containers, `layoutRoot` snaps the container and keeps child layout
animations relative to it. `layoutAnchor={{ x: 1, y: 1 }}` attaches a child to its
parent's end corner; `false` disables relative attachment.

```tsx
<motion.View layoutRoot>
  <motion.View layout="position" layoutAnchor={{ x: 1, y: 1 }} />
</motion.View>
```

Numeric corner radii and shadows receive scale correction on projected hosts.
Prefer uniform resizing when native corner/blur accuracy matters; nonuniform
native correction is approximate. Multiple web or Mason core shadows are not corrected.

```tsx
<motion.View layout style={{ borderRadius: 20, width: expanded ? 300 : 150, height: expanded ? 240 : 120 }} />
```

Combine `drag` with `layout` when content can move during a drag. It rebases the
drag origin and takes over interrupted layout animation without a position jump.
Numeric bounds still apply to translation channels; this does not add `Reorder`.

```tsx
<motion.View layout drag="x" dragMomentum={false} style={{ marginLeft: shifted ? 100 : 0 }} />
```

For shared elements, give matching hosts a `layoutId` inside a distinct
`LayoutGroup id` per independent control. A same-commit replacement animates
without retaining the old host, using current ancestor scroll offsets; use `Presence` to retain both contents for a
crossfade. Keep Presence boundaries mounted through the transition. See
[shared handoffs and reversals](../../../../../docs/app/animation-gestures.md#move-an-element-between-components).

```tsx
import { LayoutGroup, Presence, motion } from '@octane-xplat/motion'
import { View } from '@octane-xplat/ui'

export function SharedCard({ expanded }: { expanded: boolean }) {
	return <LayoutGroup id="card">
		<View style={{ position: 'relative', height: 160 }}>
			<Presence present={!expanded} style={{ position: 'absolute', left: 0, top: 0 }}>
				<motion.View layoutId="surface" style={{ width: 120, height: 80 }} />
			</Presence>
			<Presence present={expanded} style={{ position: 'absolute', left: 0, top: 0 }}>
				<motion.View layoutId="surface" style={{ width: 240, height: 160 }} />
			</Presence>
		</View>
	</LayoutGroup>
}
```

## Gestures

Normalized payloads (primitives.md). Pan on web uses raw pointer listeners
(`pointermove` isn't delegated); native uses the
NS `pan` recognizer. Both map to `{x,y,dx,dy,vx,vy,state,target}`. Native
velocity comes from iOS `velocityInView` or Android `VelocityTracker`, in
dips per second.

```tsx
import { View, Text } from '@octane-xplat/ui'

export function GestureArea() {
	return (
		<View
			onPan={({ dx, dy, vx, vy, state }) => console.log(dx, dy, vx, vy, state)}
			onSwipe={({ direction }) => console.log(direction)}
		>
			<Text>Drag here</Text>
		</View>
	)
}
```

Windows pan uses the pinned Core pointer owner: one initiating contact,
cumulative logical-DIP deltas, capture-loss cancellation and zero velocity.
Packaged x64 mouse checks cover the shared Slider's numeric pointer path; they
do not qualify touch, pen, swipe or the full Slider contract. Keep pointer
subscriptions in Core's shared event owner; the preview's direct routed
`AddHandler` projection still rejects with `E_NOINTERFACE`. See the
[Windows mouse-dragging boundary](../../../../../docs/platform/windows-setup.md#mouse-dragging).

```tsx
import { View } from '@octane-xplat/ui'

export function MouseDrag() {
  return <View onPan={({ state, dx, dy }) => console.log(state, dx, dy)} />
}
```
