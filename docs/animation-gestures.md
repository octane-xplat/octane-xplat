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

A **channel** is one value you can animate. `opacity` controls visibility,
`x` and `y` move an element, `scale` changes its size, and `rotate` turns it.
`initial` is where it starts, `animate` is where it should end up, and
`transition` describes how it gets there. A **tween** moves over a chosen
duration; a **spring** moves toward its destination with spring-like motion.

Supported channels are `opacity`, `x`, `y`, `scale`, `scaleX`, `scaleY`, and
`rotate`. Translation uses DIP on native and CSS pixels on web; rotation uses
degrees. Transition duration and delay use **seconds**. Choose a tween with
`duration`/`ease`, or `type: 'spring'` with stiffness, damping, mass, velocity,
and rest thresholds. Springs preserve velocity on retarget. The default is a
0.3-second easeInOut tween.

[MotionDemo](../packages/motion/examples/MotionDemo.tsrx) is the maintained
example for changing destinations and gesture settling. A signal read in the
component's `animate` expression subscribes that component normally; equal
numeric destinations do not restart when unrelated state renders. In the demo,
Toggle motion should move the destination 80 units; dragging is bounded to
±120 units and release settles at zero. When adapting its relative source
import to an app, import from `@octane-xplat/motion`.

Motion owns its transform and opacity channels. Put existing CSS transforms on
an outer container. Do not bind a MotionValue and an animate target to the same
channel or write it using setTranslate at the same time. Invalid targets and
conflicting inline styles throw instead of silently failing on native.

## Coordinate variants

Use named variants when several hosts should respond to one state change.
Children without their own `animate` inherit the parent's label and resolve it
against their own maps. Each child keeps its own transition and numeric target.

```tsx
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
```

The parent fades first, then the children move to zero 0.1 seconds apart.
`delayChildren` adds a base delay; `when: 'afterChildren'` waits for the children
before starting the parent. Omit `when` for concurrent playback. Child delays
add to their own per-channel delays. Reduced motion still settles transforms
immediately. An explicit child `animate` creates an independent subtree.

Label arrays, such as `animate={['visible', 'selected']}`, merge left to right;
later channels win and the last specified variant transition overrides the
host/config transition. Missing labels are ignored. Use
`variants={{ visible: (custom) => ({ x: custom }) }}` with `custom={40}` for a
host-specific target. Resolvers must return supported numeric channels.
`initial={false}` also inherits, so the whole subtree starts at its destination.

`exit`, `whileTap`, and `whileFocus` accept labels too, but resolve locally;
put explicit exit labels on children inside Presence. Their variant transition
wins for that run. Child sequencing applies to animate labels only.
The [maintained motion probe](../examples/probes/motion.tsrx) exercises inherited
labels and child sequencing; [compatibility](../packages/motion/UPSTREAM.md#variants-decision-93)
records dynamic membership, ordering, and unsupported upstream options.

## Bind values and gestures

`useMotionValue(number)` returns an owned numeric value. Bind it through the
motion host's `style`, then call `set`, `jump`, `stop`, or
`animate(destination, transition)`. Animations return a `finished` promise with
`finished`, `cancelled`, or `replaced`; only successful declarative animations
call `onAnimationComplete`. Component disposal stops owned values and removes
subscriptions.

`useTransform` maps numeric ranges or applies a single/multiple-input numeric
transformer. `useSpring` follows a value or creates a settable spring: `set`
animates and `jump` snaps. `useMotionValueEvent` subscribes without a render.
MotionValue get reads are imperative, not Octane signal subscriptions.

Use shared `onPan` events to stop playback on begin, set displacement during
movement, and spring with release velocity on end. Treat cancellation separately
and commit product state once the interaction outcome is known. Native velocity
is DIP/second; web velocity is CSS pixels/second. Web pointer-up carries the
last movement sample for up to 100 ms, so a pointer-up at the same coordinates
as the final move retains its velocity; older samples resolve to zero. For declarative bounded dragging, use the surface below. Raw `onPan` keeps its
existing dispatch and does not gain gesturehandler arbitration.

## Drag a component

Use `drag="x"` to move horizontally while allowing vertical scrolling:

```tsx
import { motion } from '@octane-xplat/motion'

;<motion.View
	drag="x"
	dragConstraints={{ left: -100, right: 100 }}
	dragElastic={false}
	onDragEnd={(_event, info) => {
		if (!info.cancelled) console.log(info.velocity.x)
	}}
/>
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

`drag={true}` owns both axes; `drag="y"` owns vertical translation. Constraints
are numeric translation limits in CSS pixels/DIP, with omitted edges unbounded.
Measured-ref constraints are deferred. Default `dragElastic={0.35}` permits
resisted overflow; `false` clamps input and all release-spring samples.
`dragMomentum` defaults to true: release velocity projects a destination 0.2
seconds ahead, bounded by constraints, then settles with a JS spring. Set it to
false to stay at the current bounded position or return from elastic overflow.
Reduced-motion policy snaps the release settlement.

Drag writes internal x/y MotionValues, or the value supplied in `style.x`/`y`,
without rendering the screen per frame. Do not also animate the same axes via
`animate`, `whileTap`, or `whileFocus`; conflicting writers throw. `initial`
can seed translation. Start waits for activation beyond 8 units. Callbacks use
`(event, info)` with point/delta/offset/velocity and `cancelled`; offset is the
unclamped pointer displacement. Cancellation suppresses momentum; unmount or
disabling drag removes handlers and cancels settlement.

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

The [compatibility record](../packages/motion/UPSTREAM.md) states the bounded
upstream API, defaults, and platform evidence. Physical-device gesture behavior
and frame pacing are pending; native compilation is not a performance claim.

## Retain content through exit

To animate a panel closing, keep it on screen until the exit animation
finishes. `Presence` manages that wait. Removing the panel immediately would
leave nothing to animate.

Keep `Presence` mounted and change its `present` prop. Render children
unconditionally inside it; putting the conditional around the child removes it
before an exit can run. Set `exit` on motion hosts inside the boundary. The
[PresenceDemo](../packages/motion/examples/PresenceDemo.tsrx) demonstrates a
counter that survives a reversed exit.

Presence renders a View wrapper and accepts its layout props. It waits for all
registered motion hosts to finish before removing the live subtree. During exit,
component state and subscriptions remain active, but the wrapper blocks input
and hides its descendants from accessibility. Focus inside the subtree is
released; reappearance does not automatically steal focus back.

Setting `present` back to true during exit retains the same hosts and state,
cancels pending removal, and animates toward current destinations. A completed
exit unmounts children; a later appearance creates fresh component state.
`onExitComplete` fires once after the exits finish, not after reversal or boundary
disposal. Entry/update completion uses the motion host's `onAnimationComplete`.

Removing Presence or an ancestor disposes immediately. Nested boundaries are
independent: removing an outer boundary disposes inner boundaries, rather than
starting a second exit sequence. Each motion host belongs to its nearest boundary.
An `exit` prop outside Presence is an error.

This is deliberately different from upstream Octane motion, which unmounts the
original component and animates a DOM clone. Xplat retains the live subtree on
both web and native; it does not export `AnimatePresence` as a compatibility alias.

## Existing imperative animation

`useAnimation` and `setTranslate` from UI remain available. The older
`useAnimation.to` duration is in milliseconds, unlike the new motion package.
[Reorder](../packages/demos/src/Reorder.tsrx) demonstrates the existing pan path.
See [animation notes](animation-notes.md) for its platform research and limitations.
