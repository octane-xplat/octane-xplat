### Use shared mouse drags on GTK and Windows

On experimental Linux GTK and Windows, a drag can take over from a nested button press without activating the button on release. The same rules apply to managed sliders and resize handles. These hosts support one mouse contact. Touch, pen, and trackpad zoom remain unavailable. Windows requires the pinned beta.24 host and a native rebuild after upgrading UI.

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

[Gestures and platform limits](https://octane-xplat.goddardai.org/gestures)
