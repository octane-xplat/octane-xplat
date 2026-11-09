# Motion and gestures

> Move, fade, or resize a screen element, and respond to dragging.

An **animation** changes a value over time, such as fading a card from
invisible to visible. A **gesture** is an interaction such as dragging that
card. Start with [a working screen](primitives.md) before adding movement.

For hardware-key handlers and text-copy feedback, see [keys and clipboard](keyboard-clipboard.md).

Start with the fade below. For a specific interaction, jump to
[dragging](#drag-a-component), [exit animations](#retain-content-through-exit),
[resizing and reordering](#layout-animations), or
[shared elements](#move-an-element-between-components). Check
[reduced motion and cleanup](#reduced-motion-and-lifecycle) before shipping.

## Animate a component

From your app folder, install the optional motion package:

```sh
bun add @octane-xplat/motion
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
degrees. On Android, pass logical DIP values directly; Motion handles display
density for native tweens and interrupted samples. Transition duration and delay use **seconds**. Choose a tween with
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

For a spring with a set completion time, use `duration` and `bounce`. Duration
is the full run time, not the time when most movement looks complete. The engine
clamps it to 0.01–10 seconds; bounce alone uses 0.8 seconds, and duration alone
uses bounce 0.3. Bounce 0 avoids overshoot; larger values add oscillation.

```tsx
import { motion } from '@octane-xplat/motion'

<motion.View animate={{ x: 100 }} transition={{ type: 'spring', duration: 0.6, bounce: 0.3 }} />
```

Any explicit `stiffness`, `damping`, or `mass` selects a physical spring and
ignores both duration and bounce. Physical defaults are stiffness 100, damping
10, and mass 1. Physical springs preserve velocity on retarget; duration/bounce
springs ignore initial and inherited velocity. Choose physical inputs for a
release that should continue with the user's drag speed.

```tsx
import { motion } from '@octane-xplat/motion'

<motion.View animate={{ x: 100 }} transition={{ type: 'spring', stiffness: 180, damping: 20 }} />
```

Combining `scale` with `scaleX` or `scaleY` multiplies their values: scale 1.5
and scaleX 1.5 produce an X size of 2.25. Motion keeps these combined tweens
on its JavaScript engine so stopping or replacing them preserves each factor,
including zero and negative values. This costs a JavaScript update each frame
for the whole tween on web and native. Ordinary eligible tweens still use the
platform animator; a zero retained factor also requires JavaScript when it
hides the animated scale entirely.

```tsx
import { motion } from '@octane-xplat/motion'

<motion.View
  initial={{ scale: 1, scaleX: 1 }}
  animate={{ scale: 2, scaleX: 2 }}
  transition={{ duration: 1, ease: 'linear' }}
/>
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

A value listener can stop or replace playback, including inside
`animationStart`. Stopping resolves that run as `cancelled`; replacement resolves
it as `replaced`. Destroying a value cancels playback and prevents later starts.
Only the run that still owns the value can emit `animationComplete`.
This continuation of `ValueControls` shows a start listener cancelling a run;
remove the listener when it is no longer needed.

```tsx
const unsubscribe = x.on('animationStart', () => x.stop())
const job = x.animate(80, { duration: 0.2 })
void job.finished.then((result) => console.log(result)) // cancelled
unsubscribe()
```

For a velocity-driven release — the value keeps moving and decays, optionally
bouncing off `min`/`max` bounds — animate with `type: 'inertia'`. The
destination argument is ignored, so pass the current value.

```ts
x.animate(x.get(), {
  type: 'inertia',
  velocity: 800,
  min: -100,
  max: 100,
  power: 0.5,
  timeConstant: 280,
  bounceStiffness: 360,
  bounceDamping: 36,
})
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

Use shared `onPan` notifications to stop playback after a drag claims input,
update displacement, and spring with release velocity on success. A second
finger cancels a one-pointer pan; it cannot restart until every finger lifts.
Callback changes preserve the active contact. For axis intent, pinch, composition,
signals, and scroll suspension, use [gesture handles](gestures.md).

```tsx
import { motion, useMotionValue } from '@octane-xplat/motion'

export function PanCard() {
  const x = useMotionValue(0)

  return (
    <motion.View
      style={{ x }}
      onPan={(event) => {
        if (event.phase === 'start') x.stop()
        if (event.phase !== 'finish') x.set(event.sample.translation.x)
        if (event.phase === 'finish') {
          const velocity = event.terminal.outcome === 'ended' ? event.terminal.sample.velocity?.x ?? 0 : 0
          void x.animate(0, { type: 'spring', velocity })
        }
      }}
    />
  )
}
```

## Combine press and focus feedback

Press takes priority over focus for each property they share. Other properties keep animating. Ending or cancelling press reveals active focus; ending both returns to the current `animate` target, numeric `style`, or host default. Updating those targets while held changes the eventual return destination. Removing a gesture prop clears that gesture. Gesture-enabled hosts use per-frame JavaScript animation so each property can keep its own playback on web and native.

```tsx
import { motion } from '@octane-xplat/motion'

export function FeedbackCard(props: { selected: boolean }) {
  return <motion.Pressable
    animate={{ scale: props.selected ? 1.2 : 1 }}
    whileFocus={{ scale: 1.05, opacity: 0.8 }}
    whileTap={{ scale: 0.95 }}
    transition={{ duration: 0.15 }}
  />
}
```

## Drag a component

Use `drag="x"` to move horizontally while allowing vertical scrolling. On web,
movement must exceed 8 pixels to start dragging. Releasing an active drag blocks
its trailing pointer click on the host and nested controls. Taps below that
threshold, keyboard activation, and the next independent click still work:

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

Motion dragging uses the shared UI input owner on web, iOS, Android, and the
experimental AppKit mouse adapter. No gesturehandler installation is needed for
Motion. Avoid attaching a separate pan to the same motion host; choose one owner
for each translated axis. Nested buttons remain semantic actions until a drag wins.

```tsx
import { motion } from '@octane-xplat/motion'
import { Button } from '@octane-xplat/ui'

export function DraggablePanel() {
  return <motion.View drag="x"><Button onPress={() => console.log('Open')}>Open</Button></motion.View>
}
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
See [motion limits](../testing/known-limits.md#motion-leaf) before relying on nested control
arbitration or full upstream drag behavior.

### Keep dragging through layout changes

Combine `drag` and `layout` when surrounding content can move during a drag.
The drag takes over from the current animated position. Layout moves update the
drag origin before drawing, so later pointer movement continues from that position.
Release or cleanup restores ordinary layout animation. Numeric drag bounds still
constrain movement in the host's translation coordinates.

```tsx
import { motion } from '@octane-xplat/motion'

export function MovableCard(props: { shifted: boolean }) {
  return <motion.View layout drag="x" dragMomentum={false}
    style={{ marginLeft: props.shifted ? 100 : 0, width: 100, height: 80 }} />
}
```


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
        if (event.phase !== 'finish') x.set(event.sample.translation.x)
        if (event.phase === 'finish') {
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

## Layout animations

`layout` on a `motion` host animates the element whenever its measured box
changes — size, position, or both. You change the layout as usual, and motion
animates the visual move for you. Works on web, iOS, Android, and the experimental macOS host.

An expanding card is the smallest useful example. Toggling the width animates
the card between 120 and 260 units:

```tsx
import { useState } from 'octane'
import { motion } from '@octane-xplat/motion'
import { Text } from '@octane-xplat/ui'

export function ExpandingCard() {
  const [wide, setWide] = useState(false)
  return (
    <motion.Pressable layout onPress={() => setWide((v) => !v)} style={{ width: wide ? 260 : 120, height: 80 }}>
      <Text>Tap to expand</Text>
    </motion.Pressable>
  )
}
```

Use `layout="position"` when a child should move with an animated parent but
keep its own size. It counter-corrects the parent scaling, so the child
measures 50 wide on screen the whole way through:

```tsx
<motion.View layout style={{ width: wide ? 260 : 120, height: 80 }}>
  <motion.View layout="position" style={{ width: 50, height: 30 }} />
</motion.View>
```

The other `layout` values pick which axes animate: `'size'`, `'preserve-aspect'`,
`'x'`, and `'y'`.

Keyed lists animate reorder automatically — even when the children's props
did not change:

```tsx
{items.map((item) => (
  <motion.View key={item.id} layout style={{ height: 44 }}>
    <Text>{item.label}</Text>
  </motion.View>
))}
```

Pass `layoutDependency` to animate only when that value changes; measurement
still refreshes either way:

```tsx
<motion.View layout layoutDependency={selectedId} style={{ height: 44 }} />
```

Tune the animation with `transition.layout` inside an orchestrated transition;
the default layout transition is a 0.45-second tween:

```tsx
<motion.View
  layout
  transition={{ layout: { duration: 0.6, ease: 'easeOut' } }}
  style={{ width: wide ? 260 : 120, height: 80 }}
/>
```

`onLayoutAnimationStart` and `onLayoutAnimationComplete` fire around each
layout run:

```tsx
<motion.View
  layout
  onLayoutAnimationStart={() => console.log('layout animation started')}
  onLayoutAnimationComplete={() => console.log('layout animation finished')}
/>
```

Give each item a stable key when reordering a list. Motion animates the existing
hosts to their new positions, including on native where unchanged children may
not render again:

```tsx
import { motion } from '@octane-xplat/motion'
import { Text, VStack } from '@octane-xplat/ui'

export function ReorderingList({ items }: { items: { id: string; name: string }[] }) {
  return <VStack>
    {items.map(item => (
      <motion.View key={item.id} layout="position">
        <Text>{item.name}</Text>
      </motion.View>
    ))}
  </VStack>
}
```

Scrolling a browser overflow container does not count as a layout change.
Motion accounts for ancestor scroll offsets automatically, so the next move
starts at the element's current position:

```tsx
import { motion } from '@octane-xplat/motion'
import { ScrollableArea } from '@octane-xplat/ui'

export function ScrollingCard({ wide }: { wide: boolean }) {
  return (
    <ScrollableArea style={{ height: 180 }}>
      <motion.View layout style={{ width: wide ? 260 : 120, height: 300 }} />
    </ScrollableArea>
  )
}
```

Use `layoutRoot` on a container that should move immediately while its children
animate relative to its new position. `layoutAnchor` chooses the child's attachment
point inside a resizing parent: zero is the start, one is the end. Use `false`
to animate the child independently of the parent's relative target.

```tsx
import { motion } from '@octane-xplat/motion'

export function AnchoredCard() {
  return (
    <motion.View layoutRoot>
      <motion.View layout="position" layoutAnchor={{ x: 1, y: 1 }} />
    </motion.View>
  )
}
```

`layoutScroll` is outside the supported
subset. Numeric corner radii and a single box shadow are corrected during scale. Web corners are corrected on each axis; scalar blur and native corners are exact under uniform scale and approximate under nonuniform scale. Existing CSS
transforms belong on an outer container. See
[Motion leaf limits](../testing/known-limits.md#motion-leaf) for the full list.

### Keep corners steady while a card expands

Set numeric corner radii and a shadow in CSS or the style object. Layout
projection compensates their scale and restores the authored values at the end.
Percentage radii retain their proportional behavior; multiple web shadows retain
Motion's uncorrected fallback.

```tsx
import { motion } from '@octane-xplat/motion'

export function ExpandingCard(props: { expanded: boolean }) {
  return <motion.View layout style={{
    width: props.expanded ? 300 : 150,
    height: props.expanded ? 240 : 120,
    borderRadius: 20,
    boxShadow: '0px 4px 12px 0px rgba(0, 0, 0, 0.2)',
  }} />
}
```

## Move an element between components

Give two motion hosts the same `layoutId` to animate a handoff between them.
The new host starts from the old host's last presented position and size, adjusted for current ancestor scrolling even when the old host has just unmounted.
Use a distinct `LayoutGroup id` for each independent control, so two tab bars
can both name their underline `"underline"`:

```tsx
import { useState } from 'octane'
import { LayoutGroup, motion } from '@octane-xplat/motion'
import { HStack, Pressable, Text } from '@octane-xplat/ui'

export function AnimatedTabs({ id }: { id: string }) {
  const tabs = ['Overview', 'Activity']
  const [selected, setSelected] = useState(tabs[0])
  return <LayoutGroup id={id}>
    <HStack>
      {tabs.map(tab => (
        <Pressable key={tab} onPress={() => setSelected(tab)}>
          <Text>{tab}</Text>
          {selected === tab && (
            <motion.View layoutId="underline" style={{ width: 80, height: 2 }} />
          )}
        </Pressable>
      ))}
    </HStack>
  </LayoutGroup>
}
```

Keep both hosts mounted with `Presence` when their contents should crossfade.
The outgoing host follows the incoming host's animated box and stays mounted
until the shared animation and any explicit exit animation finish. Reversing
the selection while it moves starts from its current position:

```tsx
import { LayoutGroup, Presence, motion } from '@octane-xplat/motion'
import { Text, View } from '@octane-xplat/ui'

export function ExpandingDetails({ expanded }: { expanded: boolean }) {
  return <LayoutGroup id="details">
    <View style={{ position: 'relative', height: 180 }}>
      <Presence present={!expanded} style={{ position: 'absolute', left: 0, top: 0 }}>
        <motion.View layoutId="card" style={{ width: 120, height: 80 }}>
          <Text>Summary</Text>
        </motion.View>
      </Presence>
      <Presence present={expanded} style={{ position: 'absolute', left: 0, top: 0 }}>
        <motion.View layoutId="card" style={{ width: 280, height: 180 }}>
          <Text>Details</Text>
        </motion.View>
      </Presence>
    </View>
  </LayoutGroup>
}
```

Set `layoutCrossfade={false}` on the incoming host to hide the outgoing host
immediately while its geometry moves. Layout timing and reduced-motion settings
apply to shared handoffs too:

```tsx
import { motion } from '@octane-xplat/motion'

export function MovingHighlight() {
  return <motion.View
    layoutId="highlight"
    layoutCrossfade={false}
    transition={{ layout: { duration: 0.3, ease: 'easeOut' } }}
    style={{ width: 80, height: 4 }}
  />
}
```

Nested groups compose their ID namespaces. Set `inherit={false}` to start a
separate namespace. Omitting a group ID inherits its parent's namespace;
`inherit="id"` and `inherit={true}` are equivalent because every registered
layout host already observes commits:

```tsx
import { LayoutGroup, motion } from '@octane-xplat/motion'

export function IndependentHighlight() {
  return <LayoutGroup id="page">
    <LayoutGroup id="toolbar" inherit={false}>
      <motion.View layoutId="highlight" style={{ width: 80, height: 4 }} />
    </LayoutGroup>
  </LayoutGroup>
}
```

## Compose motion patterns

Common product interactions — switching views, revealing a list, settling a
total, rotating supporting copy — are compositions of the pieces above, not new
primitives. The harness app ships a working showcase: run `bun run --filter @xplat/web dev` (or
`bun run --filter @xplat/mobile ios` / `bun run --filter @xplat/mobile android` with the native toolchain set up) and open
**Apps → Motion patterns**. Each pattern has a focused view there with its own
reduced-motion preview, and the maintained source is
[`MotionPatterns.tsrx`](../../packages/demos/src/MotionPatterns.tsrx).

The fragments in this section belong inside an existing component. They show
the changing state and rendered content; the maintained source provides the
complete components, imports, and inputs.

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
;<Presence present={shown === selected} onExitComplete={() => setShown(selected)}>
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
wraps. Measure the first copy with `useMeasure$` — that width is the wrap
period — then run a linear animation from `0` to `−span` on
`repeat: Infinity`. When the value completes a leg, the next copy sits
exactly where the first one did, so the jump back is invisible.

```tsx
import 'octane/signals'
const x = useMotionValue(0)
const measure = useMeasure$()
const span = measure.bounds$.get()?.width ?? 0

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
  const delay = !deleting ? (len < full.length ? typeMs : waitMs) : len > 0 ? deleteMs : waitMs
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
  if (reduced) {
    value.jump(to)
    setText(format(to))
    return
  }
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
  if (reduced) {
    progress.jump(0)
    return
  }
  if (!playing) return
  const loop = () => {
    progress.jump(0)
    progress.animate(1, { duration: period, ease: 'linear', repeat: Infinity })
  }
  const held = progress.get() % 1
  const remaining = 1 - held
  if (remaining < 0.001) loop()
  else
    void progress
      .animate(1, { duration: period * remaining, ease: 'linear' })
      .finished.then((result) => {
        if (result === 'finished') loop()
      })

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

;<motion.View style={{ x, y, rotate }}>{props.children}</motion.View>
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

;<Absolute style={{ width: size, height: size }}>
  {/* one motion.View per child, style={{ x, y, width: slot, height: slot }} */}
</Absolute>
```

A component that positions each child needs to _enumerate_ children. On the
web renderer `props.children` arrives as an opaque slot, so mark the
component with `descriptorChildren` — the same marker ui's `List` and
`Carousel` use — then read the array with `Children.toArray`.

```tsrx
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
MotionValue _is_ the drag channel, a seed effect can re-scatter chips between
gestures, and rendering the grabbed chip last raises it — render order is
the portable z-index.

```tsx
const x = useMotionValue(seedX * maxX)
const y = useMotionValue(seedY * maxY)

;<motion.View
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

```tsrx
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

On native macOS, Motion, this hook and CSS keyframes share a display-synchronized
scheduler. Pending animation callbacks keep it active; finishing or cancelling the
last callback stops it. Timing uses a monotonic clock, so changing the system date
does not change animation progress. Rebuild the native host after upgrading the
renderer. One shared clock follows the main display selected when playback starts;
independent windows on different displays do not each get their own refresh clock.

```tsx
import { useAnimation, Pressable, Text } from '@octane-xplat/ui'

export function Fade() {
  const fade = useAnimation(0.4, 'opacity')
  return <Pressable ref={fade.ref} onPress={() => { void fade.to(1, { duration: 300 }) }}><Text>Fade in</Text></Pressable>
}
```

The [maintained example](../../packages/ui/examples/AnimationDemo.tsrx) demonstrates
replacement and stop. [Animation notes](../../.agents/docs/notes/animation-notes.md#appkit-imperative-animation)
record AppKit verification and scheduling limits.

## Observe imperative animation results

Await `to` or `spring` before starting work that depends on completion. Each run
resolves with `finished`, `cancelled`, or `failed`; failures include an `error`.
Replacement, `stop()`, ref detachment, and disposal cancel the active run.
Reduced-motion settling and zero duration finish immediately. Invalid target,
duration, or spring parameters still throw synchronously before replacing a run.
Attach `ref` to the view you want to move. Translation uses CSS pixels on web,
DIPs on mobile, and points on AppKit; rotation uses degrees and scale/opacity
are unitless. This imperative API's duration uses **milliseconds**.

```tsx
import { Pressable, Text, View, useAnimation } from '@octane-xplat/ui'

export function MovingCard() {
  const x = useAnimation(0, 'translateX')

  return (
    <View>
      <Pressable
        onPress={async () => {
          const result = await x.to(80, { duration: 300 })
          if (result.status === 'finished') console.log('Arrived')
          if (result.status === 'failed') console.error(result.error)
        }}
      >
        <Text>Move</Text>
      </Pressable>
      <View ref={x.ref}>
        <Text>Card</Text>
      </View>
    </View>
  )
}
```

### Gesture event migration

Shared callbacks now receive `start`/`update` notifications with a sample, or a
`finish` notification with an `ended`/`cancelled` terminal outcome. Translation
aliases and `onSwipe` are removed. See [the gesture migration examples](gestures.md#migrate-existing-callbacks)
for named positions, velocities, ownership, and platform limits.

```tsx
import { View } from '@octane-xplat/ui'

export function DragArea() {
  return <View onPan={(event) => {
    if (event.phase === 'finish') console.log(event.terminal.outcome)
    else console.log(event.sample.translation)
  }} />
}
```

Existing fire-and-forget animation calls still work; change code that expects
`void` to accept `Promise<AnimationResult>`, or explicitly discard the promise.
See [AnimationDemo](../../packages/ui/examples/AnimationDemo.tsrx) for visible
completion feedback.

```ts
import type { AnimatedValue } from '@octane-xplat/ui'

export function moveWithoutWaiting(value: AnimatedValue): void {
  void value.to(80, { duration: 300 })
}
```
