### Choose views with native macOS segments

The experimental AppKit SegmentedControl now renders options and child items,
tracks selection and disabled/read-only state, and implements scoped arrow,
Home and End navigation. AppKit radio roles now expose checked values.
OS input, VoiceOver and presentation parity remain unqualified.

```tsx
import { SegmentedControl, SegmentedControlItem } from '@octane-xplat/ui'

export function ViewMode() {
  return <SegmentedControl defaultValue="list" accessibilityLabel="View">
    <SegmentedControlItem value="list" label="List" />
    <SegmentedControlItem value="grid" label="Grid" />
  </SegmentedControl>
}
```

[Component documentation](https://octane-xplat.goddardai.org/app/components#appkit-segmented-control)
