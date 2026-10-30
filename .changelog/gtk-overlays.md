### Modal dialogs and overlay layers on GTK

GTK apps can now import `Overlay`, `Dialog`, `DialogHeader`, `AlertDialog`,
`useImperativeDialog`, `useImperativeAlertDialog`, `FocusScope`,
`getFocusScopeCapabilities`, `LayerProvider`, `LayerContext` and
`useLayerContext` from `@octane-xplat/ui`. Overlays render in an in-window
layer above the app content — the GTK equivalent of the native `RootLayout`
host — with a modal scrim, background input suppression, focus capture on
open, focus restore on close, and Escape routed to the topmost layer.

```tsx
import { AlertDialog, Button, Dialog, DialogHeader, Text, useImperativeDialog } from '@octane-xplat/ui'
import { useState } from 'octane'

export function DeleteFlow() {
	const [open, setOpen] = useState(false)
	const confirm = useImperativeDialog()
	return (
		<>
			<Button label="Edit" clickAction={() => setOpen(true)} />
			<Dialog isOpen={open} onOpenChange={setOpen}>
				<DialogHeader title="Edit profile" />
				<Text>Dialog content portals above the window.</Text>
			</Dialog>
			<Button
				label="Delete"
				clickAction={() =>
					confirm.show(
						<AlertDialog
							isOpen
							title="Delete item?"
							description="This cannot be undone."
							actionLabel="Delete"
							onAction={() => confirm.hide()}
						/>,
					)
				}
			/>
			{confirm.element}
		</>
	)
}
```

[GTK setup and limits](https://octane-xplat.goddardai.org/linux-gtk).
