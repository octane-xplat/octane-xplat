### Toasts, lightbox, command palette and drawer on GTK

GTK apps can now import `Toast`, `ToastViewport`, `showToast`, `useToast`,
`Lightbox`, `useLightbox`, `CommandPalette` and `Drawer` from
`@octane-xplat/ui`. Toasts stack in corner layers of the window overlay with
the shared auto-hide, `maxVisible` queue, `uniqueID` collision, anchored
popover and imperative-handle contracts. The lightbox presents media on a
modal layer with swipe, arrow-key and double-tap zoom navigation; the
command palette centers a filtered list with arrow/Page/Enter keyboard
navigation and the drawer docks an edge panel over a modal scrim.

```tsx
import { useState } from 'octane'
import { Button, CommandPalette, ToastViewport, useToast } from '@octane-xplat/ui'

export function Chrome() {
	const [open, setOpen] = useState(false)
	const toast = useToast()
	return (
		<>
			<Button label="Save" clickAction={() => toast({ body: 'Saved' })} />
			<Button label="Commands" clickAction={() => setOpen(true)} />
			<ToastViewport position="topEnd" maxVisible={2} />
			<CommandPalette
				open={open}
				onOpenChange={setOpen}
				items={[{ key: 'reload', label: 'Reload data' }]}
				onValueChange={(key) => console.log('run', key)}
			/>
		</>
	)
}
```

[GTK setup and limits](https://octane-xplat.goddardai.org/linux-gtk).
