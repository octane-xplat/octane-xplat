# @octane-xplat/drawer

> Cross-platform Drawer with shared-owner mobile edge gestures

One Drawer API across web, iOS, Android, macOS, and Windows. Mobile edge-open
and drag-close gestures use the existing shared input owner. No separate
drawer gesture plugin is installed. Apps using unrelated UI widgets do not install
this package.

```tsx
import { Drawer } from '@octane-xplat/drawer'

export function Example() {
  return <Drawer defaultOpen main={null} drawer={null} />
}
```

[Setup, controls, and migration](../app/drawer.md).
The mobile implementation is a custom layout, not an OS drawer widget.

[Generated API reference](https://octane-xplat.goddardai.org/api-drawer).
