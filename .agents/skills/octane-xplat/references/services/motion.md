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

Motion `x`/`y` targets, samples, and velocities use logical DIP on Android.
Do not multiply by display density in app code; the native driver converts
only at the Android pixel boundary. Keep conversion out of shared controllers.

```tsx
import { motion } from '@octane-xplat/motion'

<motion.View animate={{ x: 100 }} transition={{ duration: 0.3 }} />
```

MotionValue lifecycle listeners may stop, destroy or replace playback synchronously.
Use the returned result to distinguish cancellation from completion; do not add
app timers to clean up an obsolete run. Disposal prevents further starts.

```tsx
const unsubscribe = x.on('animationStart', () => x.stop())
const job = x.animate(80, { duration: 0.2 })
void job.finished.then((result) => console.log(result)) // cancelled
unsubscribe()
```

Here `x` is an owned value from `useMotionValue(0)`; see the
[value example](../../../../../docs/app/animation-gestures.md#bind-values-and-gestures).

For Motion springs, `duration` is completion time in seconds, not
`visualDuration` (not exposed). Duration/bounce mode ignores velocity. Any
explicit stiffness, damping or mass selects physical mode and overrides both
time options; use physical mode for velocity-preserving gesture releases.
Do not supply physical defaults when forwarding a duration/bounce request.

```tsx
<motion.View animate={{ x: 100 }} transition={{ type: 'spring', duration: 0.6, bounce: 0.3 }} />
```

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
When diagnosing AppKit shadows, inspect active outset sibling layers and their
own transforms; the backing layer may retain an inactive shadow radius.

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
dips per second. Web keeps one initiating primary contact and cancels once on
capture loss, callback removal, or unmount. Handle `cancelled` as a return or
recovery path, never as a successful dismissal. Callback replacement continues
the contact; nested controls keep taps below capture slop.

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

For camera pinch-to-zoom, use the [camera guide](../../../../../docs/packages/package-camera.md#pinch-to-zoom).
`CameraView.onPinch` is available on iOS and Android; shared `onPinch` also
exposes optional raw focal coordinates. Mock normalization checks do not qualify
native gesture delivery or focal-coordinate units. Coordinate custom ancestor
pull-down recognizers with the pinch; they may observe the same touches.

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

For declarative Motion, combined `scale` plus `scaleX`/`scaleY` tweens use
per-frame JS writes on web/native to preserve independent factors during
interruption. Noninvertible zero retained factors also fall back; ordinary
eligible tweens remain accelerated. Do not add app-side scale decomposition.
See the [combined-scale example](../../../../../docs/app/animation-gestures.md#animate-a-component).

```tsx
import { motion } from '@octane-xplat/motion'

<motion.View animate={{ scale: 2, scaleX: 2 }} transition={{ duration: 1 }} />
```

For overlapping press/focus feedback, use declarative gesture props rather than saving and restoring controller snapshots. Press wins shared properties; release returns to active focus or the latest base. Gesture-enabled hosts use per-channel JavaScript playback. See [compose feedback](../../../../../docs/app/animation-gestures.md#combine-press-and-focus-feedback).

```tsx
import { motion } from '@octane-xplat/motion'

<motion.Pressable animate={{ scale: 1 }} whileFocus={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} />
```

For web Motion drag, keep nested controls clickable before the 8px activation threshold.
An active drag consumes only its trailing pointer click; keyboard activation and
the next independent press remain available. Do not add app-side click guards.

```tsx
import { motion } from '@octane-xplat/motion'

import { Button } from '@octane-xplat/ui'

<motion.View drag="x"><Button clickAction={() => console.log('Open')}>Open</Button></motion.View>
```

Native Android Pressable rejects tap activation for a contact that travels beyond
Android's touch slop even when its pan moves the host with the finger. Keep the
ordinary `onPress` callback; no app-side trailing-tap timer is needed. Small jitter
still permits a tap. See [native contact ownership](../../../../docs/native-pressable.md).

```tsx
import { Pressable } from '@octane-xplat/ui'

<Pressable onPan={(event) => console.log(event.dy)} onPress={() => console.log('Activate')} />
```

For AppKit, keep Motion, imperative UI animation and CSS keyframes on the
renderer-owned display-link queue. Rebuild native leaves after upgrading the
renderer; a host with only Mason's prebuilt library lacks the scheduler bridge.
The macOS clock is monotonic milliseconds, not Date.now(). A shared queue follows
one main screen per active run, so do not infer per-window multi-display pacing.
See [native scheduler ownership and verification limits](../../../../docs/notes/animation-notes.md#appkit-imperative-animation).

```tsx
import { motion } from '@octane-xplat/motion'

<motion.View animate={{ opacity: 1 }} initial={{ opacity: 0 }} transition={{ duration: 0.3 }} />
```
