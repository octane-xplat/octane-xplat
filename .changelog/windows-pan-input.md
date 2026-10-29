### Drag with the mouse on native Windows

The experimental Windows target now delivers cumulative mouse movement to
`onPan`, including release outside the control and cancellation when capture
is lost. Existing numeric Slider dragging uses the same path.

```tsx
import { View, Text } from '@octane-xplat/ui'

export function DragArea() {
  return <View onPan={({ state, dx, dy }) => console.log(state, dx, dy)}>
    <Text>Drag here</Text>
  </View>
}
```

Packaged x64 checks cover mouse input. Touch, pen, velocity and the complete
Slider contract remain open. See the [Windows mouse-dragging boundary](https://github.com/octane-xplat/octane-xplat/blob/main/docs/platform/windows-setup.md#mouse-dragging).
