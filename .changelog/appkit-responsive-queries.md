### Adapt native macOS layouts to window size

The experimental AppKit `useMediaQuery` hook now follows primary-window resize
notifications and reports desktop fine-pointer/hover traits. Native query
matching also rejects invalid pointer/hover values and respects `and` before
`or`. Actual resize/rendering and packaged-app qualification remain pending.

```tsx
import { Text, useMediaQuery } from '@octane-xplat/ui'

export function WindowLayout() {
  const wide = useMediaQuery('(min-width: 800px)')
  return <Text>{wide ? 'Wide layout' : 'Compact layout'}</Text>
}
```

[Responsive AppKit layout](https://octane-xplat.goddardai.org/app/components#responsive-appkit-layout)
