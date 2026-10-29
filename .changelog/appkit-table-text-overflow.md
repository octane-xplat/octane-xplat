### Choose how native macOS table text overflows

AppKit data tables now apply `textOverflow="truncate"` to default-rendered body
labels as one line with a tail ellipsis; wrapping is the default. Switching
modes preserves the full value. Custom cells and headers keep their own text
behavior. Native measurement, painting and installed-app qualification remain
pending.

```tsx
import { Table, pixel } from '@octane-xplat/ui'
export function Trips() {
  return <Table data={[{ name: 'A long weekend in the mountains' }]}
    columns={[{ key: 'name', width: pixel(180) }]} textOverflow="truncate" />
}
```

See [AppKit table text](https://github.com/octane-xplat/octane-xplat/blob/main/docs/tables.md#choose-body-text-wrapping-on-appkit).
