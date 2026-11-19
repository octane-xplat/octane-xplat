### Keep native pan gestures active through state updates

An inline `onPan` handler can update component state without detaching the active native pan. The gesture keeps calling the latest handler as the component rerenders.

```tsx
import { useState } from 'octane'
import { Text, View } from '@octane-xplat/ui'

export function DragSurface() {
  const [distance, setDistance] = useState(0)
  return <View onPan={(event) => {
    if (event.phase === 'update') setDistance(event.sample.translation.x)
  }}><Text>{Math.round(distance)}</Text></View>
}
```

[Pan events](https://octane-xplat.goddardai.org/gestures#migrate-existing-callbacks)
