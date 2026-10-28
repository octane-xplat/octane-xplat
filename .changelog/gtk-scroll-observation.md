### Scroll and refresh content on GTK

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

ScrollableArea now provides portable offset handles, including two-axis scrolling,
and block-axis pull-to-refresh on GTK. Spinner exposes native activity with
shared named sizes and an optional label.

```tsx
import { useRef } from 'octane'
import { Pressable, ScrollableArea, Spinner, Text, View } from '@octane-xplat/ui'
import type { ScrollableAreaHandle } from '@octane-xplat/ui'

export function Feed(props: { refreshing: boolean; refresh: () => void }) {
  const area = useRef<ScrollableAreaHandle | null>(null)
  return (
    <View>
      <ScrollableArea ref={area} width={240} height={160}
        refreshing={props.refreshing} onRefresh={props.refresh}>
        <View style={{ height: 600 }}><Text>Feed content</Text></View>
      </ScrollableArea>
      <Pressable onPress={() => area.current?.scrollToOffset({ block: 0 }, { animated: true })}>
        <Text>Back to top</Text>
      </Pressable>
      <Spinner busy={props.refreshing} size="sm" label="Refreshing" />
    </View>
  )
}
```
