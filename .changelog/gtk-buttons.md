### Buttons and display primitives on the GTK root

GTK apps can now use the shared control and text surface from
`@octane-xplat/ui`: `Button`, `IconButton`, `ToggleButton(Group)`,
`ButtonGroup`, `ClickableCard`, `Card`, `Link`, `styled`, and the display
leaves — `Kbd`, `Heading`, `Code`, `CodeBlock`, `ProgressBar`, `StatusDot`,
`Citation`, `Outline`, `Blockquote`, `Timestamp`, `Timer`, `Skeleton`,
`VisuallyHidden`, `Chip`, `Alert`, `Banner`, `EmptyState`, `Meter`,
`ProgressGroup`, `MetadataList`, `Timeline`, `Item`/`List`/`ListItem`,
`Toolbar`, `Step`, `Stepper`, `Pagination`, `FieldLabel`, `FieldStatus`.

```tsx
import { useState } from 'octane'
import { Alert, Button } from '@octane-xplat/ui'

export function SaveForm() {
	const [saved, setSaved] = useState(false)
	return (
		<>
			<Button label="Save" variant="primary" clickAction={() => setSaved(true)} />
			{saved ? <Alert tone="success">Saved</Alert> : null}
		</>
	)
}
```

`Button` activates through `clickAction` (and `href`), matching native —
plain `onPress` is a Pressable prop, not a Button prop. [GTK setup and
limits](https://octane-xplat.goddardai.org/linux-gtk).
