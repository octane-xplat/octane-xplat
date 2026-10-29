### Switch segments with the keyboard on native Windows

The experimental Windows SegmentedControl now uses native radio input for each
segment. Arrow keys, Tab, pointer and screen-reader selection all work, including
icon-only segments, read-only controls and disabled segments.

```tsx
import { SegmentedControl } from '@octane-xplat/ui'

export function ViewMode() {
  return <SegmentedControl ariaLabel="View" defaultValue="list"
    options={[{ value: 'list', label: 'List' }, { value: 'grid', label: 'Grid' }]} />
}
```

See the [Windows segmented-control boundary](https://github.com/octane-xplat/octane-xplat/blob/main/docs/platform/windows-setup.md#segmented-choices).
