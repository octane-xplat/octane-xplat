### Keep shared pages within their available space

A vertical page with a fixed amount of space now wraps text within the available width and scrolls when content grows taller than the viewport. `SafeArea` and `ScrollableArea` can shrink inside a flex parent with a height limit.

**Breaking change**

`SafeArea` now uses block layout on native, matching web. Add an `HStack` for children that relied on the old native row, or set `display: flex` when the safe area itself should arrange the children.

```tsx
import { SafeArea, ScrollableArea, VStack, Text } from '@octane-xplat/ui'

export function Notes() {
  return <VStack height={480}><SafeArea><ScrollableArea>
    <VStack padding={6}><Text>Long notes wrap within this page.</Text></VStack>
  </ScrollableArea></SafeArea></VStack>
}
```

See [shared page layout](https://octane-xplat.goddardai.org/primitives#safe-area-edges).
