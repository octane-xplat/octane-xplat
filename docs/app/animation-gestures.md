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

[MotionDemo](../../packages/motion/examples/MotionDemo.tsrx) is the maintained
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
The [maintained motion probe](../../examples/probes/motion.tsrx) exercises inherited
labels and child sequencing; [compatibility](../../packages/motion/UPSTREAM.md#variants-decision-93)
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

The maintained [motion probe](../../examples/probes/motion.tsrx) exercises live
movement, bounded momentum, callbacks, and cancellation. Web uses pointer
capture plus axis-specific touch-action; native uses PanGestureHandler
activation/failure thresholds to yield perpendicular input before activation.
Native handler dispatch does not prove OS touch delivery or scrolling conflicts.
See [motion limits](../verify/known-limits.md#motion-leaf) before relying on nested control
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

The [compatibility record](../../packages/motion/UPSTREAM.md) states the bounded
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
[PresenceDemo](../../packages/motion/examples/PresenceDemo.tsrx) demonstrates a
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

## Compose motion patterns

Common product interactions — switching views, revealing a list, settling a
total, rotating supporting copy — are compositions of the pieces above, not new
primitives. The harness app ships a working showcase: run `pnpm dev:web` (or
`pnpm dev:ios` / `pnpm dev:android` with the native toolchain set up) and open
**Apps → Motion patterns**. Each pattern has a focused view there with its own
reduced-motion preview, and the maintained source is
[`MotionPatterns.tsrx`](../../packages/demos/src/MotionPatterns.tsrx).

### Switch views with a wait-style swap

Keep the outgoing view mounted until its exit finishes, then mount the new
selection. `Presence` does the wait: present it while the shown value still
matches the selection, and mount the next view from `onExitComplete`. The
boundary blocks input and hides the leaving view from accessibility, so only
one panel is ever active. Rapid selections converge on the latest choice —
re-selecting the shown view mid-exit reverses it in place.

```tsx
const [shown, setShown] = useState(selected)

// Keep Presence mounted around the outgoing view until its exit completes;
// onExitComplete sees the latest selection, so rapid presses converge on it.
<Presence present={shown === selected} onExitComplete={() => setShown(selected)}>
	<motion.View exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.22 }}>
		{renderPanel(shown)}
	</motion.View>
</Presence>
```

Under reduced motion, skip the boundary and render the selected view directly
so it changes in place.

### Reveal a bounded group

Give each item a mount animation and a small per-index delay. The set stays
small — a handful of rows, not a feed — so the stagger never delays the last
actionable item. To replay, remount the same items through a changing key
rather than restarting timers. Mount animations do not restart on unrelated
renders, and an empty set should render a readable empty state.

```tsx
items.map((item, i) => (
	<motion.View
		key={replayId + ':' + item.id}
		initial={reduced ? false : { opacity: 0, y: 8 }}
		animate={{ opacity: 1, y: 0 }}
		transition={{ duration: 0.24, delay: i * 0.06, ease: 'easeOut' }}
	>
		<Text>{item.title}</Text>
	</motion.View>
))
```

### Update a total

Animate a `MotionValue` toward the target and copy each change into rendered
text. Set the exact target when the run finishes, and put the settled value on
a label or live region so screen readers hear the result once instead of every
interpolated frame. Under reduced motion, `jump` to the target and render it
directly.

```tsx
const value = useMotionValue(total)
useMotionValueEvent(value, 'change', (next) => setText(format(next)))
useEffect(() => {
	if (reduced) value.jump(total)
	else void value.animate(total, { duration: 0.45, ease: 'easeOut' })
}, [total, reduced])
```

A new target replaces the running animation toward the latest value, so quick
taps never replay stale destinations.

### Rotate supporting copy

For opt-in phrase rotation, run a timer that advances an index, and reuse the
wait-style swap to retire one whole phrase and bring in the next. Keep enough
dwell time to read each phrase (about three seconds or more), pause when the
app is backgrounded or the view unmounts, and require an explicit Play — never
autoplay on arrival. Under reduced motion the phrases still change, but only
through the visitor's Next action.

```tsx
useEffect(() => {
	if (!playing || reduced || phrases.length < 2) return
	const timer = setInterval(() => setIndex((i) => (i + 1) % phrases.length), 3200)
	return () => clearInterval(timer)
}, [playing, reduced, phrases.length])
```

Keep rotating copy out of the critical path: instructions, navigation, and
values a person must act on should never rotate away.

## Recreate fancy components

Popular "fancy component" effects — an endless marquee, a typewriter, a
scramble-in reveal, a number ticker, drifting badges, orbiting chips, and a
free-drag board — are also compositions, this time of a measured view, a
repeating translate, a few timers, and a shared loop phase. The harness app
ships a working showcase: open **Apps → Fancy components**; the maintained
source is [`FancyComponents.tsrx`](../../packages/demos/src/FancyComponents.tsrx).
Each effect there honors reduced motion by settling directly instead of
playing.

### Loop a marquee

A marquee is one segment of content repeated side by side inside a clipped
viewport, while a `MotionValue` walks the track left one segment-width and
wraps. Measure the first copy with `useMeasure` — that width is the wrap
period — then run a linear animation from `0` to `−span` on
`repeat: Infinity`. When the value completes a leg, the next copy sits
exactly where the first one did, so the jump back is invisible.

```tsx
const x = useMotionValue(0)
const measure = useMeasure()
const span = measure.bounds?.width ?? 0

useEffect(() => {
	if (!span || reduced) return
	x.jump(0)
	x.animate(-span, { duration: span / speed, ease: 'linear', repeat: Infinity })
	return () => x.stop()
}, [span, speed, reduced])
```

Render `repeat` copies of the same children inside a `motion.Row` bound to
`x`, and mark every copy after the first `accessible={false}` so assistive
technology announces the strip once. Clipping needs `overflow: hidden` on web
plus the platform clip on native — iOS `clipsToBounds` and Android
`setClipChildren`, which the showcase's `fancy-clip` leaf applies. Keep
spacing inside the measured segment rather than on the track, so the wrap
period stays exact. Pause by stopping the value and resume by finishing the
current leg at its remaining fraction before restarting the loop — the
showcase's `Marquee` does both without a visible jump.

### Type phrases with a caret

A typewriter is a timer-driven state machine, not an animation: hold the
current phrase index, visible length, and deleting flag, and step it on a
`setTimeout` chain — typing speed per character while growing, a dwell when
the phrase completes, delete speed while shrinking, then the next phrase.

```tsx
useEffect(() => {
	if (reduced || phrases.length === 0) return
	const full = phrases[index % phrases.length]
	const delay = !deleting
		? len < full.length ? typeMs : waitMs
		: len > 0 ? deleteMs : waitMs
	const timer = setTimeout(step, delay)
	return () => clearTimeout(timer)
}, [len, deleting, index, reduced])
```

Blink the caret on a slower interval and hold it steady under reduced
motion, which prints the first phrase whole. Typed effects belong on
supporting copy — the message must still make sense while it is half-typed.

### Reveal text through a scramble

A scramble-in reveal is the same interval pattern: a counter walks the
string's length, showing real characters up to the counter and a bounded
window of random glyphs after it. The reveal finishes when the counter
passes the string length plus the window size.

```tsx
useEffect(() => {
	if (reduced || step >= text.length + trailing) return
	const timer = setInterval(() => setStep((s) => s + 1), speedMs)
	return () => clearInterval(timer)
}, [step, reduced])
```

Put the real string on `accessibilityLabel` so screen readers hear it once
instead of the noise, and fire `onDone` when the counter finishes so callers
can chain a next step. Under reduced motion, resolve to the full text
immediately.

### Count up a value

A number ticker animates a `MotionValue` from the start to the target and
copies each change into rendered text — the same pattern as
[update a total](#update-a-total) run once instead of per update. Jump back
to `from` first so a Replay press restarts cleanly, and set the exact
formatted target when the run finishes so rounding never leaves a near-miss
on screen.

```tsx
const value = useMotionValue(from)
useMotionValueEvent(value, 'change', (next) => setText(format(next)))
useEffect(() => {
	if (reduced) { value.jump(to); setText(format(to)); return }
	value.jump(from)
	void value.animate(to, { duration: 1.6, ease: 'easeInOut' })
}, [to, reduced, runId])
```

### Drive continuous motion from a shared loop

Effects that never settle — a drifting badge, an orbiting ring — share one
driver: a `MotionValue` cycling `0` to `1` on `repeat: Infinity`, with each
visual channel derived through `useTransform`. Pause stops the value
mid-phase; resume finishes the in-flight leg at its remaining fraction and
then re-arms the loop, so motion continues without a visible jump. Reduced
motion parks the phase at `0`, which gives every consumer a deterministic
static pose. The showcase calls this helper `useLoopProgress`.

```tsx
const progress = useMotionValue(0)
useEffect(() => {
	if (reduced) { progress.jump(0); return }
	if (!playing) return
	const loop = () => {
		progress.jump(0)
		progress.animate(1, { duration: period, ease: 'linear', repeat: Infinity })
	}
	const held = progress.get() % 1
	const remaining = 1 - held
	if (remaining < 0.001) loop()
	else void progress
		.animate(1, { duration: period * remaining, ease: 'linear' })
		.finished.then((result) => { if (result === 'finished') loop() })
	return () => progress.stop()
}, [playing, period, reduced])
```

### Drift a badge

A float effect rides three sine waves on the shared phase: `x`, `y`, and
`rotate` each use a different whole number of cycles per loop, so the drift
feels organic yet wraps seamlessly. A phase `offset` per sibling keeps them
out of sync. The shared vocabulary has translate plus z-rotation — upstream's
z-depth and X/Y-axis rotation stay web-only.

```tsx
const phase = offset * Math.PI * 2
const x = useTransform(progress, (p) => Math.sin(p * Math.PI * 2 + phase) * amplitudeX)
const y = useTransform(progress, (p) => Math.sin(p * Math.PI * 4 + phase * 1.7) * amplitudeY)
const rotate = useTransform(progress, (p) => Math.sin(p * Math.PI * 6 + phase * 0.6) * rotation)

<motion.View style={{ x, y, rotate }}>{props.children}</motion.View>
```

### Orbit a ring

Circling elements are absolute children parked at a board's origin and
carried around a circle by translating from the center minus half a slot.
Each child computes its angle from the shared phase plus `index / count`, so
the ring stays evenly spaced. An `Absolute` container gives children that
overlap; a square board keeps the center math identical on both axes.

```tsx
const theta = (p: number) => (index / count + p * sign) * Math.PI * 2
const x = useTransform(progress, (p) => center - slot / 2 + Math.cos(theta(p)) * radius)
const y = useTransform(progress, (p) => center - slot / 2 + Math.sin(theta(p)) * radius)

<Absolute style={{ width: size, height: size }}>
	{/* one motion.View per child, style={{ x, y, width: slot, height: slot }} */}
</Absolute>
```

A component that positions each child needs to *enumerate* children. On the
web renderer `props.children` arrives as an opaque slot, so mark the
component with `descriptorChildren` — the same marker ui's `List` and
`Carousel` use — then read the array with `Children.toArray`.

```tsx
import { Children, descriptorChildren } from 'octane'

function RingImpl(props: { children?: any }) @{
	const items = Children.toArray(props.children)
	// …render one orbiting motion.View per item
}
const Ring = descriptorChildren(RingImpl)
```

### Scatter draggable chips

A drag board is an `Absolute` container whose children own their `x`/`y`
MotionValues as position. `drag` plus numeric `dragConstraints` bounds the
translate to the board, `dragElastic` resists past the edge, and release
velocity projects into a bounded spring — under reduced motion the motion
leaf jumps the release to its target instead. Because a bound `style.x`/`y`
MotionValue *is* the drag channel, a seed effect can re-scatter chips between
gestures, and rendering the grabbed chip last raises it — render order is
the portable z-index.

```tsx
const x = useMotionValue(seedX * maxX)
const y = useMotionValue(seedY * maxY)

<motion.View
	drag={true}
	dragConstraints={{ left: 0, top: 0, right: maxX, bottom: maxY }}
	dragElastic={0.2}
	whileTap={{ scale: 1.06 }}
	style={{ x, y }}
>
	{props.children}
</motion.View>
```

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

The [maintained example](../../packages/ui/examples/AnimationDemo.tsrx) demonstrates
replacement and stop. [Animation notes](../notes/animation-notes.md#appkit-imperative-animation)
record AppKit verification and scheduling limits.
