### Keep native pan callbacks stable during state updates

Native `onPan` now keeps the same callback bridge when an inline handler or local state changes. It reads the latest committed callback, and removing the handler still removes its listener.

```tsx
import { useState } from 'octane'
import { View } from '@octane-xplat/ui'

export function DragSurface() {
  const [dragging, setDragging] = useState(false)
  return <View onPan={event => setDragging(event.state === 'moved')}>
    {dragging ? 'Dragging' : 'Ready'}
  </View>
}
```

See [gestures](https://octane-xplat.goddardai.org/app/animation-gestures) for pan events and their lifecycle.
