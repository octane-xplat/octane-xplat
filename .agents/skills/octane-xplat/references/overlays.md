# Overlays — Sheet, Overlay, and platform modals

For app lightboxes, keep using the public UI export until the package cutover.
`@octane-xplat/lightbox` is a private implementation preview; its headless
thumbnail parts do not yet have native device qualification. See the
[port evidence and remaining work](../../../docs/notes/lightbox-native.md).

```tsx
import { Lightbox } from '@octane-xplat/ui'
```

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

A shade-free `Overlay` becomes a modal layer with `isModal`: web focus
isolation and Escape, Android back dismissal, iOS modal accessibility —
no dimmed backdrop. macOS ignores it.

```tsx
<Overlay open={open} isModal accessibilityLabel="Photo viewer" onDismiss={close}>
	<Text>Full-screen content</Text>
</Overlay>
```

Web Overlay can associate its actual dialog host with title/description IDs.
On native, supply a literal `accessibilityLabel`; DOM ID associations are not
implemented. Do not substitute an action hint for a dialog description.

```tsx
<Overlay open isModal accessibilityLabelledBy="viewer-title" accessibilityDescribedBy="viewer-description">
	<h2 id="viewer-title">Photos</h2>
	<p id="viewer-description">Trip gallery</p>
</Overlay>
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
providers pass through. On web the top-layer viewport renders inside
`display: contents` wrappers anchored to the stack's edge, so an empty
viewport has no layout footprint; announcements go through the shared
document-level live regions.

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

## AppKit source-owned window-layer prerequisite

The private same-window showLayer host now accepts createContentRoot, optional
whenCommitted readiness, deferPresentation and explicit show(). Declarative
callers must actually use a native source-tree portal; a custom outlet that
creates another standalone root still loses providers. Stale commits/closed
owners cannot reveal. The original window/content container owns the layer;
anchor exclusion from light dismissal is opt-in and does not consume events.

```ts
const layer = bridge.showLayer({
	anchor, createContentRoot, deferPresentation: true,
	lightDismiss: true, excludeAnchorFromDismiss: true,
	position: (bounds) => ({ left: bounds.left, top: bounds.top + bounds.height + 8 }),
})
layer?.show()
// On source removal:
layer?.close()
```

Eight source cases and the manual fixture are authored, unrun. This engine seam
does not migrate public Popover/useLayer. Typeahead/Tokenizer suggestions now
have the separate [source-owned result host](primitives.md#appkit-floating-typeahead-source-subset);
Tokenizer's outer unfocusedLayer editor remains inline.
Do not swap to native NSPopover just to make results float: its current separate
root/window changes provider and input-focus ownership. Retain the result host's same-window
source portal and compound blur/dismissal ownership.
Native commit/context/geometry/focus/AX and packaging qualification remains deferred.
See [the host contract](../../../../packages/macos-renderer/README.md#stage-a-source-owned-window-layer).
