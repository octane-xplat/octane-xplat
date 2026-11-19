### Start a drag at the configured distance

**Breaking change**

`useDraggable` now honors `activationDistance` below eight units, including immediate activation at zero. Attach the returned `pan` to `View` through `gestures` in place of the old `onPan` result. A custom `renderHandle` also receives the pan handle.

```tsx
import { useDraggable } from '@octane-xplat/dnd-kit'
import { Text, View } from '@octane-xplat/ui'

// Render inside DndContext.
export function Card() {
  const drag = useDraggable({ id: 'card', activationDistance: 4 })
  return <View ref={drag.ref} style={drag.style} gestures={drag.pan}><Text>Move me</Text></View>
}
```

[Drag-and-drop setup](https://octane-xplat.goddardai.org/package-dnd-kit)
