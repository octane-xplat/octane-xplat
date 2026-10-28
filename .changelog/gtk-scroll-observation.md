### Observe scroll edges on GTK

The GTK target now exposes useScrollableArea. Its inline and block state reports
whether content overflows and whether the viewport is at either edge.
The state follows native wheel input, offset changes and content resizing.

```tsx
import { Text, useScrollableArea } from '@octane-xplat/ui'
import type { HostElement } from '@octane-xplat/jsx/intrinsics'

export function FeedViewport() {
  const area = useScrollableArea<HostElement>({ axis: 'block' })
  return (
    <scrollview {...area.getViewportProps()} orientation="vertical" style={{ width: 200, height: 100 }}>
      <masonview {...area.getContentProps()} style={{ height: 600 }}>
        <Text>{area.state.block.atEnd ? 'End of feed' : 'Scroll for more'}</Text>
      </masonview>
    </scrollview>
  )
}
```

Attach it to a GTK scrollview, with one content layout inside. Ordinary View
containers do not become scrollable by attaching the hook.

[GTK setup and supported UI](https://octane-xplat.goddardai.org/platform/linux-gtk)
