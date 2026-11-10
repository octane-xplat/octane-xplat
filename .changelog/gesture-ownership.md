### Shared gesture ownership, pinch, and input suspension

Draggable surfaces and nested buttons now share one input owner. Add a stable gesture handle to a View; ordinary callback updates keep the active contact. Gesture hooks expose read-only state signals, explicit positions, translation, nullable velocity, and separate successful release and cancellation.

```tsx
import { Button, View, usePanGesture$ } from '@octane-xplat/ui'

export function Panel() {
  const drag = usePanGesture$({ axis: 'x', onEnd: (sample) => console.log(sample.translation) })
  return <View gestures={drag}><Button onPress={() => {}}>Open</Button></View>
}
```

Compose pan and pinch with `compete`, `simultaneous`, or `prioritize`. Use `useInteractionScope$` for capability-gated, reference-counted suspension without changing overflow. Web, iOS, and Android have shared gesture adapters; experimental macOS supports mouse pan. GTK/Windows shared attachments fail explicitly. Full scroll/input suspension currently supports bounded UIKit/Mason subtrees on iOS; web supports input-only inert subtrees. Other suspension requests return a failure result.

This breaks the previous event contract: `onPan`/`onPinch` now send `start`/`update` samples and `finish` terminal outcomes. Remove `state`, `dx/dy`, `vx/vy`, translation `x/y` aliases, and `onSwipe`; derive swipe actions from successful pans. `onPress` now includes activation source and an optional pointer sample. Motion uses the shared owner and no longer requires its gesturehandler peer or installation step. See [gestures and migration](https://octane-xplat.goddardai.org/gestures) and [Motion](https://octane-xplat.goddardai.org/animation-gestures).
