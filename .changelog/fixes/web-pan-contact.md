### Recover web pans when pointer capture changes

Web pan gestures now keep the first primary contact instead of restarting when another finger touches the view. Capture loss and teardown cancel the gesture once, so interrupted interactions can recover.

```tsx
import { View } from '@octane-xplat/ui'

export function DragArea() {
  return <View onPan={(event) => {
    if (event.state === 'cancelled') console.log('Return to the resting position')
  }} />
}
```

[Animation and gestures](https://octane-xplat.goddardai.org/app/animation-gestures)
