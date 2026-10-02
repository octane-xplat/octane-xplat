# Overlays — Sheet, Overlay, and platform modals

The shared root package exports `BottomSheet`, `Overlay`, and `Popover`,
plus `openBottomSheet`/`closeBottomSheet`. `Sheet` and `openSheet` below are
older names retained in the headings for existing links. Modal widgets with OS
chrome are platform-authentic subpath exports.

```tsx
import { BottomSheet, Text } from '@octane-xplat/ui'

export function BagDetails() {
	return (
		<BottomSheet label="Bag details" isOpen={false}>
			<Text>Bag details</Text>
		</BottomSheet>
	)
}
```

## Platform modal widgets

`UIModal` + `openModal` are exported from `@octane-xplat/ui/ios`;
`MaterialDialog` + `openModal` are exported from
`@octane-xplat/ui/android`. There is no shared `Modal` or `openModal` export.
Both native APIs mount content in a separate root, so context and theme
classes do not cross from the presenter (see styling/root-boundaries.md).
For a shared in-window surface, compose `BottomSheet`, `Overlay`, or `Popover`.

```tsx
// Details.ios.tsx
import { UIModal } from '@octane-xplat/ui/ios'
import { Text } from '@octane-xplat/ui'

export function Details() {
	return (
		<UIModal open={false}>
			<Text>Trip details</Text>
		</UIModal>
	)
}
```

## `openSheet(Component, props)` / `closeSheet()`

`openBottomSheet(Component, props)` is the current shared service name.
Native mounts a bottom-docked host in `RootLayout`; web creates a portal
layer under `document.body` and renders the component in its own Octane root.
The web backdrop dismisses the sheet, and the returned promise resolves when
it closes. Content is parameterized, so any component can render in the sheet.

```tsx
import { openBottomSheet, Pressable, Text } from '@octane-xplat/ui'

function Details({ params, close }: { params: { name: string }; close: () => void }) {
	return (
		<Pressable onPress={close}>
			<Text>{params.name}: close</Text>
		</Pressable>
	)
}
// Call from an app action; the promise resolves when the sheet closes.
await openBottomSheet(Details, { name: 'Carry-on' })
```

## `openOverlay()` / `closeOverlay()`

`openOverlay()`/`closeOverlay()` are older app-local service names, not root
package exports. Current shared screens declare `Overlay` for floating content
with a shade, or `BottomSheet` for bottom-anchored content.

```tsx
import { useState } from 'octane'
import { Overlay, Text } from '@octane-xplat/ui'

export function FloatingDetails() {
	const [open, setOpen] = useState(false)
	return (
		<Overlay open={open} shadeCover onDismiss={() => setOpen(false)}>
			<Text>Trip details</Text>
		</Overlay>
	)
}
```

## `RootLayout.open()` promises

`RootLayout.open()` returns a Promise. Handle its rejection so an open failure
does not become an unhandled exception. When reusing a host that may still be
attached, close or detach it before opening again; newly created sheet hosts
do not need that reuse check.

```ts
// Native-only helper (.mobile.ts); RootLayout is a NativeScript host API.
import { GridLayout, getRootLayout } from '@nativescript/core'

async function openHost() {
	const root = getRootLayout()
	if (!root) return
	const host = new GridLayout()
	try {
		await root.open(host)
	} catch (error) {
		console.error('Could not open host', error)
	}
}
```

## getRootLayout()

Works because `Screen` renders a `RootLayout` on native. `getRootLayout()`
returns null before the first screen mounts — guard it.

```ts
// Host.mobile.ts
import { getRootLayout } from '@nativescript/core'

const root = getRootLayout()
if (root) console.log(root.getChildrenCount())
```
