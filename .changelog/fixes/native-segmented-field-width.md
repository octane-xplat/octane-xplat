### Size the complete native segmented field

On iOS, Android and GTK, SegmentedControl sizes its label, choices and status
as one field. Previously, the native component ignored width.

```tsx
import { SegmentedControl } from '@octane-xplat/ui'

export function ViewChoice() {
  return <SegmentedControl label="View" width={280} layout="fill"
    options={[{ value: 'grid', label: 'Grid' }, { value: 'list', label: 'List' }]} />
}
```

[Input controls](https://octane-xplat.goddardai.org/components#inputs)
