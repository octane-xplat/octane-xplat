# Drag, zoom, and stop interactions

> Build draggable surfaces that cooperate with buttons, scrolling, and pinch zoom.

Build a draggable panel with buttons that still work. The framework watches movement first and takes ownership only after the drag activates. A tap on a nested button remains a button action.

```tsx
import { useState } from 'octane'
import { Button, Text, View, usePanGesture$ } from '@octane-xplat/ui'

export function Panel() {
  const [distance, setDistance] = useState(0)
  const [saved, setSaved] = useState(false)
  const drag = usePanGesture$({
    axis: 'x',
    onUpdate: (sample) => setDistance(sample.translation.x),
  })
  return (
    <View gestures={drag}>
      <Text>Dragged {Math.round(distance)} points</Text>
      <Button onPress={() => setSaved(true)}>Save</Button>
      <Text>{saved ? 'Saved' : 'Unsaved'}</Text>
    </View>
  )
}
```

Use this API on web, iOS, and Android. Experimental macOS, native GTK, and Windows provide a one-mouse-contact adapter. Desktop pen and direct-touch input, pinch, and trackpad magnification remain unsupported. Windows requires the pinned beta.24 host and a native rebuild after upgrading UI; updating only the JavaScript bundle does not install the native input bridge. Attaching a gesture does not promise that an arbitrary native widget can yield input.

## Choose when a drag wins

A horizontal drag can coexist with a vertical scroll area. Attach the drag to the reveal surface and use a framework scroll viewport inside it. The framework reserves the horizontal axis at each managed viewport. It leaves vertical scrolling available. Browser scrolling that already owns a contact cannot be reclaimed by changing a signal.

```tsx
import { Stack, Text, View, usePanGesture$ } from '@octane-xplat/ui'

export function Reveal() {
  const reveal = usePanGesture$({
    axis: 'x',
    activation: { distance: 8, dominance: 1.2 },
    onEnd: (sample) => console.log('Choose a destination:', sample.translation.x),
  })
  return (
    <View gestures={reveal}>
      <Stack isScrollable direction="vertical" style={{ height: 300 }}>
        <Text>Scrollable content</Text>
      </Stack>
    </View>
  )
}
```

The defaults are 8 logical units of movement and a 1.2 ratio between the requested axis and the other axis. `axis: 'both'` uses total movement. One pointer is allowed by default. A second finger cancels an active one-pointer pan with `pointer-count`; that pan cannot restart until all fingers lift. Native editing and manipulation controls, including sliders, keep priority over ancestor panels.

```tsx
import { View, usePanGesture$ } from '@octane-xplat/ui'

export function DragHandle() {
  const drag = usePanGesture$({ axis: 'both', pointers: { min: 1, max: 1 } })
  return <View gestures={drag} accessibilityLabel="Drag handle" />
}
```

## Read movement and positions

`translation` is cumulative movement in a coordinate basis frozen at admission. `position.local` is the current point in the attached host; it can change when the host moves underneath a stationary finger. `startPosition.local` gives the grab point. Local coordinates are `null` if conversion fails. Window coordinates use a top-left origin; screen coordinates are `null` when unavailable. Distances use CSS pixels on web and logical points/DIPs on native. Velocity uses those units per second and is nullable. Targets are stable opaque identities, not DOM or native views; use a ref for host operations.

```tsx
import { View, usePanGesture$ } from '@octane-xplat/ui'

export function PositionedDrag() {
  const drag = usePanGesture$({
    axis: 'both',
    onStart(sample) {
      console.log('Grab point', sample.startPosition.local)
    },
    onUpdate(sample) {
      console.log(sample.position.window, sample.translation, sample.velocity)
      console.log(
        sample.pointerCount,
        sample.contacts.map((contact) => contact.id),
      )
    },
  })
  return <View gestures={drag} />
}
```

## Give pinch and drag a clear relationship

`compete` lets the first activated gesture win; argument order breaks a tie. A pinch may start when a second finger cancels an exact-one-pointer dismiss pan. The remaining finger never resumes that dismiss pan. Keep zoom limits, media geometry, and dismissal thresholds in your app.

```tsx
import { useRef } from 'octane'
import { View, usePanGesture$, usePinchGesture$, compete } from '@octane-xplat/ui'

export function MediaSurface(props: {
  zoom: number
  setZoom(value: number): void
  dismiss(): void
}) {
  const baseline = useRef(1)
  const dismiss = usePanGesture$({
    axis: 'y',
    onEnd(sample) {
      if (sample.translation.y > 120 && props.zoom === 1) props.dismiss()
    },
  })
  const pinch = usePinchGesture$({
    onStart() {
      baseline.current = props.zoom
    },
    onUpdate(sample) {
      props.setZoom(Math.max(1, Math.min(4, baseline.current * sample.scale)))
    },
  })
  return <View gestures={compete(pinch, dismiss)} />
}
```

`simultaneous` permits both children to activate. Composition applies to handles attached to the same host. Rebuilding an equivalent composition does not replace the registrations. A handle can attach to only one host, and duplicate handles are errors.

```tsx
import { View, usePanGesture$, usePinchGesture$, simultaneous } from '@octane-xplat/ui'

export function TwoFingerTransform() {
  const move = usePanGesture$({ axis: 'both', pointers: { min: 2, max: 2 } })
  const zoom = usePinchGesture$({})
  return <View gestures={simultaneous(move, zoom)} />
}
```

`prioritize` makes a later gesture wait until earlier eligible gestures fail. A horizontal reveal can get the first chance while a general drag waits. Waiting preserves the original movement; it can add latency until the first gesture rejects the direction.

```tsx
import { View, usePanGesture$, prioritize } from '@octane-xplat/ui'

export function RevealWithFallback() {
  const reveal = usePanGesture$({ axis: 'x' })
  const move = usePanGesture$({ axis: 'both' })
  return <View gestures={prioritize(reveal, move)} />
}
```

## Observe state without changing ownership

Each hook returns read-only `phase$`, `active$`, and `pointerCount$` signals. Samples are off by default. Choose `samples: 'frame'` for reactive rendering or `'input'` when every sample is needed. This choice stays fixed for the hook's lifetime. Ownership, cancellation, and lifecycle callbacks remain synchronous regardless of sample cadence. A module that reads a signal during render needs a runtime signals import.

```tsx
import 'octane/signals'
import { Text, View, usePanGesture$ } from '@octane-xplat/ui'

export function DragStatus() {
  const drag = usePanGesture$({ axis: 'x', samples: 'frame' })
  return (
    <View gestures={drag}>
      <Text>{drag.active$.get() ? 'Dragging' : 'Ready'}</Text>
      <Text>{Math.round(drag.sample$?.get()?.translation.x ?? 0)}</Text>
    </View>
  )
}
```

Supply either committed `enabled` or a live boolean `enabled$` signal. Setting `enabled$` to false cancels synchronously. Re-enabling it while contacts remain down does not restart the gesture. Ordinary rerenders update callbacks without replacing the recognizer. Recognition settings are captured for the current contact sequence; new settings apply to the next one.

```tsx
import { useSignal$ } from 'octane/signals/client'
import { Button, View, usePanGesture$ } from '@octane-xplat/ui'

export function InterruptibleDrag() {
  const enabled$ = useSignal$(true)
  const drag = usePanGesture$({ axis: 'x', enabled$ })
  return (
    <View>
      <Button onPress={() => enabled$.set(false)}>Stop dragging</Button>
      <View gestures={drag} />
    </View>
  )
}
```

## Finish once and handle interruption

`onStart` runs after ownership is claimed. `onEnd` means successful release; `onCancel` means interruption. `onFinalize` follows either and runs exactly once for a started session. Cancellation includes system interruption, capture loss, disablement, detachment, scope suspension, and extra pointers. A session's `cancel()` stops it synchronously. Cleanup releases input even if a callback throws. Use start to stop an in-flight animation at its current value, so a new drag can grab it naturally.

```tsx
import { useRef } from 'octane'
import { motion, useMotionValue } from '@octane-xplat/motion'
import { usePanGesture$ } from '@octane-xplat/ui'

export function RegrabbableMedia() {
  const x = useMotionValue(0)
  const origin = useRef(0)
  const drag = usePanGesture$({
    axis: 'x',
    onStart() {
      x.stop()
      origin.current = x.get()
    },
    onUpdate(sample) {
      x.set(origin.current + sample.translation.x)
    },
    onEnd(sample) {
      void x.animate(0, { type: 'spring', velocity: sample.velocity?.x ?? 0 })
    },
    onCancel() {
      void x.animate(0, { type: 'spring', velocity: 0 })
    },
  })
  return <motion.View gestures={drag} style={{ x }} />
}
```

Motion's built-in `drag` uses the parent's frozen coordinate plane for `offset`, `delta`, and velocity, so its translation follows the finger through parent and host scaling. Its `point` uses logical window coordinates. It rejects `gestures`, `onPan`, or `onPinch` on the same host while `drag` is enabled. For custom composition, use handles and MotionValues as in `RegrabbableMedia` above, without `drag`.

```tsx
import { motion } from '@octane-xplat/motion'

export function ScaledCard() {
  return (
    <motion.View style={{ scale: 1.25 }}>
      <motion.View
        drag="x"
        style={{ scale: 1.5 }}
        onDrag={(_event, info) => console.log(info.offset.x, info.point.x)}
      />
    </motion.View>
  )
}
```

## Suspend a scope without changing overflow

An interaction scope can cancel descendant gestures and stop supported scrolling at its current offset. `suspend()` returns a lease: release it when its owner finishes. Overlapping leases keep the scope suspended until the last release. Unmount releases owned state. Explicit programmatic scrolling after suspension may move content; release preserves that new offset. Content shrink may clamp normally. Portals outside the protected physical subtree prevent suspension; adding an uncovered portal while suspended is rejected.

```tsx
import { useRef, useState } from 'octane'
import { Button, Text, View, useInteractionScope$ } from '@octane-xplat/ui'
import type { Suspension } from '@octane-xplat/ui'

export function LockableContent() {
  const scope = useInteractionScope$()
  const lease = useRef<Suspension | null>(null)
  const [status, setStatus] = useState('Ready')
  return (
    <View>
      <Button
        onPress={() => {
          if (lease.current) return
          const result = scope.suspend()
          if (result.ok) {
            lease.current = result.lease
            setStatus('Suspended')
          } else setStatus(`Cannot suspend: ${result.reason}`)
        }}
      >
        Suspend content
      </Button>
      <Button
        onPress={() => {
          lease.current?.release()
          lease.current = null
          setStatus('Ready')
        }}
      >
        Release
      </Button>
      <Text>{status}</Text>
      <View interactionScope={scope}>
        <Text>Protected content</Text>
      </View>
    </View>
  )
}
```

Suspension is all-or-nothing and capability-gated. The initial iOS adapter supports known UIKit/Mason subtrees and rejects foreign or editing surfaces it cannot freeze safely. Web supports input-only subtrees with `inert`; scrollable subtrees return `unsupported` because stopping browser momentum is not qualified. Android, macOS, GTK, and Windows full suspension return `unsupported`. `detached` means the scope has no mounted host; `busy` prevents reentrant acquisition during a transition. There is no `support$` on a drag handle. Check the operation's result when using optional suspension.

## Keep semantic activation available

A claimed drag suppresses the correlated trailing pointer click. It preserves a fresh tap, keyboard activation, and accessibility/virtual actions. `onPress` includes the source and an optional pointer sample. Keyboard and accessibility actions have no fabricated position. Keep buttons or other semantic alternatives for actions that also have gestures. `onPress` responds immediately; combining double press with seeking or timing windows remains app policy.

```tsx
import { Pressable, Text } from '@octane-xplat/ui'

export function PlayButton() {
  return (
    <Pressable onPress={(event) => console.log(event.source, event.pointer?.position.local)}>
      <Text>Play</Text>
    </Pressable>
  )
}
```

## Migrate existing callbacks

`onPan` and `onPinch` remain conveniences with the same samples and terminal outcomes. Replace `state`, `dx/dy`, and `vx/vy` with `phase`, `translation`, and nullable `velocity`. `x/y` translation aliases and `onSwipe` are removed. Derive a swipe action from a successful pan and your own thresholds. Use typed handles when you need axis intent, enablement, composition, signals, or cancellation. `onPress` handlers that ignore their new argument keep working.

```tsx
import { View } from '@octane-xplat/ui'

export function SwipeAction(props: { next(): void }) {
  return (
    <View
      onPan={(event) => {
        if (event.phase !== 'finish' || event.terminal.outcome !== 'ended') return
        const { x, y } = event.terminal.sample.translation
        if (x < -80 && Math.abs(x) > Math.abs(y)) props.next()
      }}
    />
  )
}
```
