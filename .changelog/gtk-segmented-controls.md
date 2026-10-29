### Choose compact options on GTK

SegmentedControl and SegmentedControlItem are available from the GTK UI root.
They support local or controlled selection, grouped keyboard and pointer input,
field labels and state, hug/fill tracks and named icon-only segments.

```tsx
import { SegmentedControl } from '@octane-xplat/ui'

export function ViewChoice() {
  return <SegmentedControl label="View" width={280} layout="fill"
    defaultValue="grid" options={[
      { value: 'grid', label: 'Grid' },
      { value: 'list', label: 'List' },
    ]} />
}
```

[Linux GTK segmented choices](https://octane-xplat.goddardai.org/linux-gtk#segmented-choices)
