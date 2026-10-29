# @octane-xplat/drawer

One Drawer API across web, iOS, Android, macOS, and Windows. Mobile edge-open
and drag-close gestures use `@nativescript-community/ui-drawer`; its gesture
engine is owned by this package. Apps using unrelated UI widgets do not install
this package.

```tsx
import { Drawer } from '@octane-xplat/drawer'

export function Example() {
	return <Drawer defaultOpen main={null} drawer={null} />
}
```

[Setup, controls, and migration](../../docs/app/drawer.md).
The mobile implementation is a custom layout, not an OS drawer widget.
