### Keep shared pages within their available space

**Breaking change:** `SafeArea` now lays out children in a column on every platform. `SafeArea` and `ScrollableArea` can shrink inside a bounded parent, so ordinary vertical pages wrap paragraphs and control rows within their available width and keep tall content scrollable. Explicit content widths and inline/both-axis scrolling remain available. Layouts that relied on native SafeArea's implicit row should use an `HStack` for that row; explicit `style` sizing and `flexShrink` still override the defaults.

```tsx
import { SafeArea, ScrollableArea, VStack, Text } from '@octane-xplat/ui'

export function Notes() {
  return <VStack height={480}><SafeArea><ScrollableArea>
    <VStack padding={6}><Text>Long notes wrap within this page.</Text></VStack>
  </ScrollableArea></SafeArea></VStack>
}
```

See [shared page layout](https://octane-xplat.goddardai.org/primitives#safe-area-edges).
