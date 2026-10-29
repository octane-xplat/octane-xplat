### Scroll wide data tables on AppKit

AppKit data Table now has an experimental horizontal viewport source path.
Constrain its container; pixel widths remain fixed and proportional columns
honor minimum widths. Native layout, scrolling and packaging remain unqualified.

```tsx
import { Table, View, pixel } from '@octane-xplat/ui'
<View style={{ width: 360 }}><Table data={[{ name: 'Ada', team: 'Platform' }]}
  columns={[{ key: 'name', width: pixel(180) }, { key: 'team', width: pixel(400) }]} />
</View>
```

Child-composed tables keep their existing flow. Sticky column positioning is
still unimplemented on AppKit. See the [table guide](https://github.com/octane-xplat/octane-xplat/blob/main/docs/tables.md#wide-data-tables-on-appkit).
