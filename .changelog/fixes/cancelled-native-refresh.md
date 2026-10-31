### Ignore cancelled native refresh gestures

An interrupted native pull-to-refresh gesture now returns the indicator to rest
without calling onRefresh. A controlled refresh stays docked until refreshing
becomes false. Refreshable Mason regions also honor their viewport dimensions
and keep the indicator overlaid in the viewport's grid cell.

```tsx
import { ScrollableArea, Text } from '@octane-xplat/ui'

export function Feed(props: { loading: boolean; refresh: () => void }) {
  return (
    <ScrollableArea width={240} height={160} refreshing={props.loading} onRefresh={props.refresh}>
      <Text>Feed content</Text>
    </ScrollableArea>
  )
}
```

[ScrollableArea reference](https://octane-xplat.goddardai.org/app/components)
