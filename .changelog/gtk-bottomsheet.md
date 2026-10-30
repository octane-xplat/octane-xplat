### Bottom sheets on the GTK root

GTK apps can now use the shared bottom-sheet surface from `@octane-xplat/ui`:
`BottomSheet`, `BottomSheetSwitcher`, `openBottomSheet`, `closeBottomSheet` and
`useImperativeBottomSheet`.

```tsx
import { useState } from "octane"
import { BottomSheet, Button, Text } from "@octane-xplat/ui"

export function FilterSheet() {
	const [open, setOpen] = useState(false)
	return (
		<>
			<Button label="Filters" clickAction={() => setOpen(true)} />
			<BottomSheet
				isOpen={open}
				onOpenChange={setOpen}
				label="Filters"
				height="capped"
				snapPoints={[0.25, 0.5, 0.9]}
			>
				<Text>Choose filters</Text>
			</BottomSheet>
		</>
	)
}
```

Sheets dock in a modal overlay layer with a scrim, respect every `height`
budget and `snapPoints` detent, and drag from the grabber row to snap or
dismiss. `presentation="bottom-sheet"` on `DropdownMenu`/`MoreMenu` now opens a
real sheet, and `presentation="adaptive"` picks the sheet only when a touch
seat is present — fine-pointer GTK stays on the anchored popover.
[GTK setup and limits](https://octane-xplat.goddardai.org/linux-gtk).
