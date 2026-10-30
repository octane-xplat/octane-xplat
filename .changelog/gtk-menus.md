### Anchored menus on the GTK root

GTK apps can now use the shared menu surface from `@octane-xplat/ui`:
`DropdownMenu`, `ContextMenu`, `MoreMenu`, `DropdownMenuContext` and
`useDropdownMenuContext`.

```tsx
import { useState } from 'octane'
import { DropdownMenu } from '@octane-xplat/ui'

export function FileActions(props: { onRename: () => void }) {
	const [showHidden, setShowHidden] = useState(false)
	return (
		<DropdownMenu
			button={{ label: 'Actions' }}
			items={[
				{ key: 'rename', type: 'action', label: 'Rename', onSelect: props.onRename },
				{ key: 'hidden', type: 'checkbox', label: 'Show hidden', value: showHidden, onValueChange: setShowHidden },
				{ key: 'divider', type: 'separator' },
				{ key: 'sort', type: 'radio-group', label: 'Sort', value: 'name', items: [{ key: 'name', label: 'Name', value: 'name' }] },
			]}
		/>
	)
}
```

Menus open as anchored popovers. `ContextMenu` triggers on long-press
(the shared native gesture — right-click/Menu-key/Shift+F10 are web-only).
`presentation="bottom-sheet"` opens a real `BottomSheet`;
`presentation="adaptive"` picks the sheet on touch seats and the popover on
fine-pointer desktops.
[GTK setup and limits](https://octane-xplat.goddardai.org/linux-gtk).
