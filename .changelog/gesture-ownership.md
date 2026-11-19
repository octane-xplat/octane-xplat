### Let drags and buttons share the same surface

Attach a `usePanGesture$` handle to a `View` with `gestures`. A tap still activates a nested button. Once a drag takes over, releasing it won’t activate the button. Gesture hooks expose read-only signals and separate callbacks for release and cancellation.

```tsx
import { Button, View, usePanGesture$ } from '@octane-xplat/ui'

export function Panel({ open }: { open(): void }) {
  const drag = usePanGesture$({ axis: 'x', onEnd: (sample) => console.log(sample.translation.x) })
  return <View gestures={drag}><Button label="Open" onPress={open} /></View>
}
```

**Breaking change**

In `onPan` and `onPinch`, replace `state` with `phase` and read movement from `translation` and nullable `velocity`. Replace `onSwipe` with a distance check on successful pan release. `onPress` now reports the activation source and an optional pointer sample.

```tsx
import { View } from '@octane-xplat/ui'

export function SwipeArea({ next }: { next(): void }) {
  return <View onPan={(event) => {
    if (event.phase !== 'finish' || event.terminal.outcome !== 'ended') return
    const { x, y } = event.terminal.sample.translation
    if (x < -80 && Math.abs(x) > Math.abs(y)) next()
  }} />
}
```

Motion uses the shared gesture system. Remove the extra gesturehandler installation if Motion was its only user.

[Gestures and callback migration](https://octane-xplat.goddardai.org/gestures#migrate-existing-callbacks)
