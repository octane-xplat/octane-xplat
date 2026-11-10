### Share mouse drags with native desktop buttons

Experimental GTK and Windows mouse adapters now feed the same gesture owner as AppKit and mobile. Use the existing pan hooks and composition for desktop surfaces; managed sliders and resize handles use the same ownership rules. The initial desktop subset supports one mouse contact. Touch, pen, trackpad magnification, and full input/scroll suspension remain unavailable. Windows requires the pinned beta.24 runtime and a native rebuild after upgrading UI.

```tsx
import { Button, View, usePanGesture$ } from '@octane-xplat/ui'

export function Panel() {
  const drag = usePanGesture$({ axis: 'x', onEnd: (sample) => console.log(sample.translation.x) })
  return (
    <View gestures={drag}>
      <Button onPress={() => console.log('Open')}>Open</Button>
    </View>
  )
}
```

See the [gesture guide](https://octane-xplat.goddardai.org/gestures) for coordinate and cancellation contracts. Native desktop qualification remains bounded to the tested runtime and scenario; a transport test does not establish packed app, Motion, Mason or screen-reader coverage.
