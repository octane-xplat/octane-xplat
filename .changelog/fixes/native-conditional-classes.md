### Apply conditional classes on native components

Native components now keep enabled class names from conditional records, including records nested in class arrays. Removing a condition removes its class, so authored layout and visual overrides can return to their defaults.

```tsx
import { View } from '@octane-xplat/ui'

export function Panel({ arranged }: { arranged: boolean }) {
  return <View className={['panel', { 'flex flex-col': arranged }]} />
}
```

See [class composition](https://octane-xplat.goddardai.org/styling).
