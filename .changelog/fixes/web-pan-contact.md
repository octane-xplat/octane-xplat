### Recover web pans after a lost pointer capture

A second touch no longer restarts the current pan. If pointer capture is lost or the view is removed, the active pan cancels once, so the next interaction can start cleanly.

```tsx
import { View } from '@octane-xplat/ui'

export function DragArea({ reset }: { reset(): void }) {
  return <View onPan={(event) => {
    if (event.phase === 'finish' && event.terminal.outcome === 'cancelled') reset()
  }} />
}
```

[Handle interrupted gestures](https://octane-xplat.goddardai.org/gestures#finish-once-and-handle-interruption)
