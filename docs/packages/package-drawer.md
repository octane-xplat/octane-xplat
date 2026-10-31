# @octane-xplat/drawer

> Cross-platform Drawer with native mobile edge gestures

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

[Setup, controls, and migration](../app/drawer.md).
The mobile implementation is a custom layout, not an OS drawer widget.

[Generated API reference](https://octane-xplat.goddardai.org/api-drawer).
