# Motion and gestures

> Move, fade, or resize a screen element, and respond to dragging.

An **animation** changes a value over time, such as fading a card from
invisible to visible. A **gesture** is an interaction such as dragging that
card. Start with [a working screen](primitives.md) before adding movement.

## Animate a component

From your app folder, install the optional motion package:

```sh
pnpm add @octane-xplat/motion
```

It works alongside `@octane-xplat/ui`. Import
`motion` and wrap content in `motion.View`, `motion.Row`, or `motion.Pressable`.
They preserve the corresponding UI primitive's layout, accessibility, and input
props. Supply `initial` and `animate` numeric targets and a `transition`.
`initial={false}` starts at the destination without an entry animation.

```tsx
import { motion } from '@octane-xplat/motion'

export function Example() {
	return (
		<motion.View initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} />
	)
}
```

A **channel** is one value you can animate. `opacity` controls visibility,
`x` and `y` move an element, `scale` changes its size, and `rotate` turns it.
`initial` is where it starts, `animate` is where it should end up, and
`transition` describes how it gets there. A **tween** moves over a chosen
duration; a **spring** moves toward its destination with spring-like motion.

```tsx
import { motion } from '@octane-xplat/motion'

export function Example() {
	return (
		<motion.View
			initial={{ x: 0, scale: 0.9 }}
			animate={{ x: 40, scale: 1 }}
			transition={{ type: 'spring', stiffness: 200, damping: 30 }}
		/>
	)
}
```

Supported channels are `opacity`, `x`, `y`, `scale`, `scaleX`, `scaleY`, and
`rotate`. Translation uses DIP on native and CSS pixels on web; rotation uses
degrees. Transition duration and delay use **seconds**. Choose a tween with
`duration`/`ease`, or `type: 'spring'` with stiffness, damping, mass, velocity,
and rest thresholds. Springs preserve velocity on retarget. The default is a
0.3-second easeInOut tween.

```tsx
import { motion } from '@octane-xplat/motion'

export function Example() {
	return (
		<motion.View
			animate={{ opacity: 1, x: 20, y: 10, scale: 1, scaleX: 1, scaleY: 1, rotate: 15 }}
			transition={{ duration: 0.3, delay: 0.1, ease: 'easeInOut' }}
		/>
	)
}
```

[MotionDemo](../packages/motion/examples/MotionDemo.tsrx) is the maintained
example for changing destinations and gesture settling. A signal read in the
component's `animate` expression subscribes that component normally; equal
numeric destinations do not restart when unrelated state renders. In the demo,
Toggle motion should move the destination 80 units; dragging is bounded to
±120 units and release settles at zero. When adapting its relative source
import to an app, import from `@octane-xplat/motion`.

```tsx
import { useSignal$ } from 'octane/signals/client'
import { motion } from '@octane-xplat/motion'
import { Pressable, Text } from '@octane-xplat/ui'

export function Destination() {
	const moved$ = useSignal$(false)
	return (
		<>
			<Pressable onPress={() => moved$.set(!moved$.get())}>
				<Text>Toggle motion</Text>
			</Pressable>
			<motion.View animate={{ x: moved$.get() ? 80 : 0 }} />
		</>
	)
}
```

Motion owns its transform and opacity channels. Put existing CSS transforms on
an outer container. Do not bind a MotionValue and an animate target to the same
channel or write it using setTranslate at the same time. Invalid targets and
conflicting inline styles throw instead of silently failing on native.

```tsx
import { View } from '@octane-xplat/ui'
import { motion } from '@octane-xplat/motion'

export function RotatedCard() {
	return (
		<View className="rotated-card">
			<motion.View animate={{ x: 40 }} />
		</View>
	)
}
```

## Coordinate variants

Use named variants when several hosts should respond to one state change.
Children without their own `animate` inherit the parent's label and resolve it
against their own maps. Each child keeps its own transition and numeric target.

```tsx
import { motion } from '@octane-xplat/motion'

export function Example() {
	return (
		<motion.View
			initial="hidden"
			animate="visible"
			variants={{
				hidden: { opacity: 0 },
				visible: {
					opacity: 1,
					transition: { duration: 0.2, when: 'beforeChildren', staggerChildren: 0.1 },
				},
			}}
		>
			<motion.View variants={{ hidden: { y: 20 }, visible: { y: 0 } }} />
			<motion.View variants={{ hidden: { y: 20 }, visible: { y: 0 } }} />
		</motion.View>
	)
}
```

The parent fades first, then the children move to zero 0.1 seconds apart.
`delayChildren` adds a base delay; `when: 'afterChildren'` waits for the children
before starting the parent. Omit `when` for concurrent playback. Child delays
add to their own per-channel delays. Reduced motion still settles transforms
immediately. An explicit child `animate` creates an independent subtree.

```tsx
import { motion } from '@octane-xplat/motion'

export function Example() {
	return (
		<motion.View
			animate="visible"
			variants={{
				visible: {
					opacity: 1,
					transition: { when: 'afterChildren', delayChildren: 0.1, staggerChildren: 0.1 },
				},
			}}
		>
			<motion.View variants={{ visible: { y: 0 } }} />
			<motion.View animate={{ x: 20 }} />
		</motion.View>
	)
}
```

Label arrays, such as `animate={['visible', 'selected']}`, merge left to right;
later channels win and the last specified variant transition overrides the
host/config transition. Missing labels are ignored. Use
`variants={{ visible: (custom) => ({ x: custom }) }}` with `custom={40}` for a
host-specific target. Resolvers must return supported numeric channels.
`initial={false}` also inherits, so the whole subtree starts at its destination.

```tsx
import { motion } from '@octane-xplat/motion'

export function Example() {
	return (
		<motion.View
			initial={false}
			animate={['visible', 'selected']}
			custom={40}
			variants={{
				visible: { opacity: 1 },
				selected: (custom: number) => ({ x: custom, transition: { duration: 0.2 } }),
			}}
		/>
	)
}
```

`exit`, `whileTap`, and `whileFocus` accept labels too, but resolve locally;
put explicit exit labels on children inside Presence. Their variant transition
wins for that run. Child sequencing applies to animate labels only.
The [maintained motion probe](../examples/probes/motion.tsrx) exercises inherited
labels and child sequencing; [compatibility](../packages/motion/UPSTREAM.md#variants-decision-93)
records dynamic membership, ordering, and unsupported upstream options.

```tsx
import { motion, Presence } from '@octane-xplat/motion'

export function Panel(props: { open: boolean }) {
	return (
		<Presence present={props.open}>
			<motion.Pressable
				animate="visible"
				exit="hidden"
				whileTap="pressed"
				whileFocus="focused"
				variants={{
					visible: { opacity: 1 },
					hidden: { opacity: 0 },
					pressed: { scale: 0.95 },
					focused: { scale: 1.05 },
				}}
			/>
		</Presence>
	)
}
```

## Bind values and gestures

`useMotionValue(number)` returns an owned numeric value. Bind it through the
motion host's `style`, then call `set`, `jump`, `stop`, or
`animate(destination, transition)`. Animations return a `finished` promise with
`finished`, `cancelled`, or `replaced`; only successful declarative animations
call `onAnimationComplete`. Component disposal stops owned values and removes
subscriptions.

```tsx
import { motion, useMotionValue } from '@octane-xplat/motion'
import { Pressable, Text } from '@octane-xplat/ui'

export function ValueControls() {
	const x = useMotionValue(0)
	return (
		<>
			<motion.View style={{ x }} />
			<Pressable onPress={() => x.set(20)}>
				<Text>Set</Text>
			</Pressable>
			<Pressable onPress={() => x.jump(0)}>
				<Text>Reset</Text>
			</Pressable>
			<Pressable onPress={() => x.stop()}>
				<Text>Stop</Text>
			</Pressable>
			<Pressable
				onPress={() => {
					const job = x.animate(80, { duration: 0.2 })
					void job.finished.then((result) => console.log(result))
				}}
			>
				<Text>Animate</Text>
			</Pressable>
		</>
	)
}
```

`useTransform` maps numeric ranges or applies a single/multiple-input numeric
transformer. `useSpring` follows a value or creates a settable spring: `set`
animates and `jump` snaps. `useMotionValueEvent` subscribes without a render.
MotionValue get reads are imperative, not Octane signal subscriptions.

```tsx
import {
	motion,
	useMotionValue,
	useTransform,
	useSpring,
	useMotionValueEvent,
} from '@octane-xplat/motion'
import { Pressable, Text } from '@octane-xplat/ui'

export function DerivedValue() {
	const x = useMotionValue(0)
	const opacity = useTransform(x, [0, 100], [1, 0])
	const smoothX = useSpring(x, { stiffness: 200, damping: 30 })
	useMotionValueEvent(x, 'change', (value) => console.log(value))
	return (
		<>
			<motion.View style={{ x: smoothX, opacity }} />
			<Pressable onPress={() => x.set(100)}>
				<Text>Move</Text>
			</Pressable>
			<Pressable onPress={() => smoothX.jump(0)}>
				<Text>Snap</Text>
			</Pressable>
		</>
	)
}
```

Use shared `onPan` events to stop playback on begin, set displacement during
movement, and spring with release velocity on end. Treat cancellation separately
and commit product state once the interaction outcome is known. Native velocity
is DIP/second; web velocity is CSS pixels/second. Web pointer-up carries the
last movement sample for up to 100 ms, so a pointer-up at the same coordinates
as the final move retains its velocity; older samples resolve to zero. For declarative bounded dragging, use the surface below. Raw `onPan` keeps its
existing dispatch and does not gain gesturehandler arbitration.

```tsx
import { motion, useMotionValue } from '@octane-xplat/motion'

export function PanCard() {
	const x = useMotionValue(0)
	return (
		<motion.View
			style={{ x }}
			onPan={(event) => {
				if (event.state === 'began') x.stop()
				if (event.state === 'moved') x.set(event.dx)
				if (event.state === 'ended') x.animate(0, { type: 'spring', velocity: event.vx })
				if (event.state === 'cancelled') x.animate(0, { type: 'spring', velocity: 0 })
			}}
		/>
	)
}
```

## Drag a component

Use `drag="x"` to move horizontally while allowing vertical scrolling:

```tsx
import { motion } from '@octane-xplat/motion'

export function DragCard() {
	return (
		<motion.View
			drag="x"
			dragConstraints={{ left: -100, right: 100 }}
			dragElastic={false}
			onDragEnd={(_event, info) => {
				if (!info.cancelled) console.log(info.velocity.x)
			}}
		/>
	)
}
```

Native apps install the optional motion peer with
`pnpm add @nativescript-community/gesturehandler@2.0.45`. In the native entry,
call its `install()` before creating any Page, Frame, or root view:

```ts
import { install } from '@nativescript-community/gesturehandler'

install()
// Create the app's root after installation.
```

Use `install()` without the override flag to preserve existing `onPan` observers.
A normal Page supplies the handler root; custom native roots need the plugin's
`GestureRootView`. The peer is required for the native motion entry, and is
unnecessary on web. Missing native setup has no raw-pan fallback.

```ts
import { install } from '@nativescript-community/gesturehandler'
import { Application, Page } from '@nativescript/core'

install()
Application.run({ create: () => new Page() })
```

`drag={true}` owns both axes; `drag="y"` owns vertical translation. Constraints
are numeric translation limits in CSS pixels/DIP, with omitted edges unbounded.
Measured-ref constraints are deferred. Default `dragElastic={0.35}` permits
resisted overflow; `false` clamps input and all release-spring samples.
`dragMomentum` defaults to true: release velocity projects a destination 0.2
seconds ahead, bounded by constraints, then settles with a JS spring. Set it to
false to stay at the current bounded position or return from elastic overflow.
Reduced-motion policy snaps the release settlement.

```tsx
import { motion } from '@octane-xplat/motion'

export function Example() {
	return (
		<motion.View
			drag={true}
			dragConstraints={{ left: -100, right: 100, top: -50, bottom: 50 }}
			dragElastic={false}
			dragMomentum={false}
		/>
	)
}
```

Drag writes internal x/y MotionValues, or the value supplied in `style.x`/`y`,
without rendering the screen per frame. Do not also animate the same axes via
`animate`, `whileTap`, or `whileFocus`; conflicting writers throw. `initial`
can seed translation. Start waits for activation beyond 8 units. Callbacks use
`(event, info)` with point/delta/offset/velocity and `cancelled`; offset is the
unclamped pointer displacement. Cancellation suppresses momentum; unmount or
disabling drag removes handlers and cancels settlement.

```tsx
import { motion, useMotionValue } from '@octane-xplat/motion'

export function DragValue() {
	const x = useMotionValue(0)
	return (
		<motion.View
			drag="x"
			style={{ x }}
			onDragEnd={(_event, info) => {
				if (!info.cancelled) console.log(info.offset.x, x.get())
			}}
		/>
	)
}
```

The maintained [motion probe](../examples/probes/motion.tsrx) exercises live
movement, bounded momentum, callbacks, and cancellation. Web uses pointer
capture plus axis-specific touch-action; native uses PanGestureHandler
activation/failure thresholds to yield perpendicular input before activation.
Native handler dispatch does not prove OS touch delivery or scrolling conflicts.
See [motion limits](known-limits.md#motion-leaf) before relying on nested control
arbitration or full upstream drag behavior.

## Reduced motion and lifecycle

Some people set their device to reduce animation. Choose how your app should
respect that preference, especially for movement that is not essential.
“Lifecycle” refers to when a component appears, updates, and is removed.

`MotionConfig` supplies inherited transition defaults and a `reducedMotion`
policy: `never` (default), `always`, or `user`. Reduced motion settles transforms
immediately while allowing opacity fades. `useReducedMotion` observes the system
preference independently of config. Imperative gesture settling should use it
to choose immediate playback when appropriate. Pass configuration separately
into overlays with their own Octane root.

```tsx
import { MotionConfig, motion, useReducedMotion, useMotionValue } from '@octane-xplat/motion'

function Card() {
	const reduced = useReducedMotion()
	const x = useMotionValue(0)
	return (
		<motion.View
			style={{ x }}
			onPan={(event) => {
				if (event.state === 'moved') x.set(event.dx)
				if (event.state === 'ended' || event.state === 'cancelled') {
					if (reduced) x.jump(0)
					else x.animate(0, { type: 'spring' })
				}
			}}
		/>
	)
}
export function App() {
	return (
		<MotionConfig reducedMotion="user" transition={{ duration: 0.2 }}>
			<Card />
		</MotionConfig>
	)
}
```

The [compatibility record](../packages/motion/UPSTREAM.md) states the bounded
upstream API, defaults, and platform evidence. Physical-device gesture behavior
and frame pacing are pending; native compilation is not a performance claim.

## Retain content through exit

To animate a panel closing, keep it on screen until the exit animation
finishes. `Presence` manages that wait. Removing the panel immediately would
leave nothing to animate.

```tsx
import { Presence, motion } from '@octane-xplat/motion'
import { Text } from '@octane-xplat/ui'

export function Panel(props: { open: boolean }) {
	return (
		<Presence present={props.open}>
			<motion.View animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
				<Text>Trip details</Text>
			</motion.View>
		</Presence>
	)
}
```

Keep `Presence` mounted and change its `present` prop. Render children
unconditionally inside it; putting the conditional around the child removes it
before an exit can run. Set `exit` on motion hosts inside the boundary. The
[PresenceDemo](../packages/motion/examples/PresenceDemo.tsrx) demonstrates a
counter that survives a reversed exit.

```tsx
import { Presence, motion } from '@octane-xplat/motion'
import { Text } from '@octane-xplat/ui'

export function Panel(props: { open: boolean }) {
	return (
		<Presence present={props.open}>
			<motion.View animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
				<Text>Trip details</Text>
			</motion.View>
		</Presence>
	)
}
```

Presence renders a View wrapper and accepts its layout props. It waits for all
registered motion hosts to finish before removing the live subtree. During exit,
component state and subscriptions remain active, but the wrapper blocks input
and hides its descendants from accessibility. Focus inside the subtree is
released; reappearance does not automatically steal focus back.

```tsx
import { Presence, motion } from '@octane-xplat/motion'
import { Text } from '@octane-xplat/ui'

export function Panel(props: { open: boolean }) {
	return (
		<Presence present={props.open} className="flex-1">
			<motion.View animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
				<Text>Trip details</Text>
			</motion.View>
		</Presence>
	)
}
```

Setting `present` back to true during exit retains the same hosts and state,
cancels pending removal, and animates toward current destinations. A completed
exit unmounts children; a later appearance creates fresh component state.
`onExitComplete` fires once after the exits finish, not after reversal or boundary
disposal. Entry/update completion uses the motion host's `onAnimationComplete`.

```tsx
import { Presence, motion } from '@octane-xplat/motion'
import { Text } from '@octane-xplat/ui'

export function Panel(props: { open: boolean }) {
	return (
		<Presence present={props.open} onExitComplete={() => console.log('Removed')}>
			<motion.View
				animate={{ opacity: 1 }}
				exit={{ opacity: 0 }}
				onAnimationComplete={() => console.log('Arrived')}
			>
				<Text>Trip details</Text>
			</motion.View>
		</Presence>
	)
}
```

Removing Presence or an ancestor disposes immediately. Nested boundaries are
independent: removing an outer boundary disposes inner boundaries, rather than
starting a second exit sequence. Each motion host belongs to its nearest boundary.
An `exit` prop outside Presence is an error.

```tsx
import { Presence, motion } from '@octane-xplat/motion'

export function Nested(props: { outer: boolean; inner: boolean }) {
	return (
		<Presence present={props.outer}>
			<motion.View exit={{ opacity: 0 }}>
				<Presence present={props.inner}>
					<motion.View exit={{ x: -20 }} />
				</Presence>
			</motion.View>
		</Presence>
	)
}
```

This is deliberately different from upstream Octane motion, which unmounts the
original component and animates a DOM clone. Xplat retains the live subtree on
both web and native; it does not export `AnimatePresence` as a compatibility alias.

## Existing imperative animation

Use UI's `useAnimation` for a single value attached to a component ref. This
works on web, iOS, Android, and native AppKit. For example, press **Slide** to
move a card 80 points or pixels to the right, then **Return** to spring back:

```tsx
import { View, Text, Pressable, useAnimation } from '@octane-xplat/ui'

export function SlidingCard() @{
  const x = useAnimation(0, 'translateX')
  <View>
    <Pressable onPress={() => x.to(80, { duration: 300 })}><Text>Slide</Text></Pressable>
    <Pressable onPress={() => x.spring(0)}><Text>Return</Text></Pressable>
    <View ref={x.ref}><Text>Moving card</Text></View>
  </View>
}
```

The ref connects the controller to the native view or web element. Pass
`x.ref` directly: animation frames write that view without rendering the
screen again. `x.value` reads the latest sample; it does not subscribe the
screen to updates. The controller remains the same across renders. The initial
value and property are chosen when the hook first runs.

`to` is linear and takes **milliseconds**, with a default of 300. Motion's
`transition.duration` uses seconds. `spring` takes positive damping and
stiffness, with defaults of 14 and 120 and unit mass. Larger damping reduces
oscillation. A new `to` or `spring` replaces playback from the latest sample;
`stop()` freezes it there. Passing a null ref stops playback, and removing the
owning component disposes its controller. Do not reuse a disposed controller.

On AppKit the default property is `translateX`. Supported properties are
`opacity`, `translateX`, `translateY`, `scale`, `scaleX`, `scaleY`, and `rotate`.
Translations use points with positive Y downward; rotation uses degrees.
Unsupported AppKit properties throw. When macOS Reduce Motion is enabled,
transforms snap to their destination, including when the setting changes during
playback; opacity may still fade. This hook has no MotionConfig, Presence,
variant, or completion-promise contract. Use the motion leaf for those
capabilities on its documented targets. `setTranslate` also remains available.

The [maintained example](../packages/ui/examples/AnimationDemo.tsrx) demonstrates
replacement and stop. [Animation notes](animation-notes.md#appkit-imperative-animation)
record AppKit verification and scheduling limits.
