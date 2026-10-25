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

On web, a `Popover` anchored inside a modal stays within that modal's layer.
Keep the anchor inside the intended owner so focus, inert background isolation,
and nested Escape dismissal agree.

```tsx
// ModalChoice.web.tsx
import { useRef } from 'octane'
import { Overlay, Popover } from '@octane-xplat/ui'

export function ModalChoice() {
	const anchor = useRef<HTMLButtonElement | null>(null)
	return <Overlay open shadeCover accessibilityLabel="Choose">
		<button ref={anchor}>Options</button>
		<Popover anchor={anchor} open><button>Pick</button></Popover>
	</Overlay>
}
```

For retained full-screen siblings, follow [retained screen layers](primitives.md#retained-screen-layers). A native overlay host does not make its own Screen an overlay.

## Platform modal widgets

`UIModal` + `openModal` are exported from `@octane-xplat/ui/ios`;
`MaterialDialog` + `openModal` are exported from
`@octane-xplat/ui/android`. There is no shared `Modal` or `openModal` export.
`openModal` returns a `ModalHandle` — the close-result promise plus
`close(result)` scoped to that instance. Declarative children and
`component` + `params` content of `UIModal` and `MaterialDialog` portal from
their declaring Octane tree into the system modal host, preserving context
and live context updates. Global `openModal(Component, params)` uses a separate root; the scoped hook
below supplies source ownership when providers are needed. The
modal host receives its own theme classes (see styling/root-boundaries.md).

Use the OS modal only when platform chrome is intended:

```tsx
/** @jsxImportSource @octane-xplat/jsx */
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

## Preserve providers with scoped services

On iOS/Android, declarative `Dialog`, `BottomSheet`, `Overlay`, `Popover`,
and OS modal content portal from their declaring tree. For imperative sheets,
use `useImperativeBottomSheet` and keep its returned `element` mounted below
all required providers. That mounted element is the **source owner**: it
supplies context and controls the content's lifetime. Removing it closes its
owned content; a removed owner cannot reopen it. Provider inheritance follows
the mounted element even when `open` is called elsewhere.

```tsx
import { useImperativeBottomSheet, Button, Text } from '@octane-xplat/ui'

function Picker(props: { close: (value?: string) => void }) {
	return <Button clickAction={() => props.close('saved')}>Save</Button>
}
export function Actions() {
	const sheet = useImperativeBottomSheet()
	return (
		<>
			<Text>Choose a bag</Text>
			<Button
				clickAction={() => {
					void sheet.open(Picker)
				}}
			>
				Choose
			</Button>
			{sheet.element}
		</>
	)
}
```

OS modals have a corresponding scoped hook. Use it in a matching platform file
and render its element under the providers the modal needs.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
// ModalActions.ios.tsx
import { useImperativeModal } from '@octane-xplat/ui/ios'
import { Button, Text } from '@octane-xplat/ui'

function Details() {
	return <Text>Trip details</Text>
}
export function ModalActions() {
	const modal = useImperativeModal()
	return (
		<>
			<Button
				clickAction={() => {
					void modal.open(Details)
				}}
			>
				Details
			</Button>
			{modal.element}
		</>
	)
}
```

For platform-specific exceptions, including macOS registry/toast/layer paths,
read the [current ownership inventory](../../../docs/notes/portal-boundaries.md).
Theme inheritance is a separate host concern; see
[theme across hosts](styling/root-boundaries.md).

## Ownerless `openBottomSheet` / `closeBottomSheet`

Use global `openBottomSheet(Component, props)` when content does not need the
caller's providers. This ownerless service keeps a standalone root on each target.
Native mounts a bottom-docked host in `RootLayout`; web creates a portal
layer under `document.body` and renders the component in its own Octane root.
The web backdrop dismisses the sheet, and the returned `BottomSheetHandle` —
a promise — resolves when it closes; `handle.close(result)` dismisses that
specific sheet (while `closeBottomSheet(result)` still targets the most
recent). Content is parameterized, so any component can render in the sheet.

```tsx
import { openBottomSheet, Pressable, Text } from '@octane-xplat/ui'

function Details({ params, close }: { params: { name: string }; close: () => void }) {
	return (
		<Pressable onPress={close}>
			<Text>{params.name}: close</Text>
		</Pressable>
	)
}
// Call from an app action; the handle resolves when the sheet closes.
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

## Layer root and headless hooks

`LayerProvider` is optional — it mounts a `ToastViewport` configured by
`toast` (position, maxVisible, inset) so `useToast()`/`showToast()` dock
there. Without a provider, toasts lazily self-mount at defaults; nested
providers pass through.

```tsx
<LayerProvider toast={{ position: 'topEnd', maxVisible: 3 }}>
	<App />
</LayerProvider>
```

Three headless hooks mirror the Astryx contracts when you need control the
components don't expose:

- `useLayer({ mode: 'context' | 'fixed', lightDismiss, dismissOnEscape })` —
  bind `ref` to the anchor and `render(children, { placement, alignment })`.
- `usePopover({ dialogLabel, hasLightDismiss, hasEscapeDismiss })` — returns
  `triggerRef`, `triggerProps` (spread for `aria-haspopup`/`aria-expanded`),
  `show`/`hide`/`toggle`, `isOpen`, and `render(children, position)`.
- `useTooltip({ placement, delay, hideDelay })` — returns `ref` (binds both
  position and interaction; `positionRef`/`interactionRef` split them),
  `describedBy` for `aria-describedby`, and `renderTooltip(children)`. On
  iOS/Android the refs bind but no hint mounts, matching `Tooltip`.

`useMediaQuery(query)` reports live matches — full `matchMedia` on web; a
restricted grammar (`(max|min)-(width|height)`, `pointer`, `hover`,
`orientation`, `and`/`or`/`,`/`not`) evaluated against the main screen on
iOS/Android.

`DropdownMenu` and `ContextMenu` accept `presentation: 'popover' |
'bottom-sheet' | 'adaptive'` plus `label` — the sheet surface mounts the
same data-mode items (`description` and `variant: 'destructive'` included)
inside a `BottomSheet`. Adaptive tracks the compact coarse-pointer query on
web and resolves to sheet on mobile, matching `MoreMenu`.
