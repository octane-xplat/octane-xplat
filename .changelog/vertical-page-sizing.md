### Keep shared pages within their available space

**Breaking change:** `SafeArea` now uses block layout on every platform, matching its original web behavior. Children are no longer implicitly flex items. `SafeArea` and `ScrollableArea` can shrink inside a bounded flex parent, and scroll viewports default to a maximum height of 100% of their containing block, so ordinary vertical pages wrap paragraphs and control rows within their available width and keep tall content scrollable.

Explicit content widths and inline/both-axis scrolling remain available. Layouts that relied on native SafeArea's implicit row should use an `HStack` for that row. Use an explicit `display: flex` class or style when SafeArea's children need flex alignment or remaining-height distribution; authored `display`, `flexShrink`, and `maxHeight` styles can override the defaults.

```tsx
import { SafeArea, ScrollableArea, VStack, Text } from '@octane-xplat/ui'

export function Notes() {
  return <VStack height={480}><SafeArea><ScrollableArea>
    <VStack padding={6}><Text>Long notes wrap within this page.</Text></VStack>
  </ScrollableArea></SafeArea></VStack>
}
```

See [shared page layout](https://octane-xplat.goddardai.org/primitives#safe-area-edges).
