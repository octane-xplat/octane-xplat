### Decide how pinch and drag work together

Use `usePinchGesture$` to track pinch gestures on web, iOS, and Android. Pair it with a drag using `compete` to let the first gesture to activate win. Use `simultaneous` to let both run, or `prioritize` to give one precedence.

```tsx
import { compete, usePanGesture$, usePinchGesture$, View } from '@octane-xplat/ui'

export function MediaSurface() {
  const drag = usePanGesture$({ axis: 'y' })
  const pinch = usePinchGesture$({ onUpdate: (sample) => console.log(sample.scale) })
  return <View gestures={compete(pinch, drag)} />
}
```

[Compose pinch and drag](https://octane-xplat.goddardai.org/gestures#give-pinch-and-drag-a-clear-relationship)
