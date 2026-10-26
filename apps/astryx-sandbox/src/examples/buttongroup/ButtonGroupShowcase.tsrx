// Port of upstream ButtonGroup/ButtonGroupShowcase.tsx (Astryx 0.6.4, MIT).
import { Button, ButtonGroup, Icon, IconButton, Stack } from '@octane-xplat/ui'

export function ButtonGroupShowcase() @{
	<Stack direction="horizontal" gap={6} vAlign="center">
		<ButtonGroup label="Clipboard actions">
			<Button label="Copy" icon={<Icon name="xplat-copy" />} />
			<Button label="Cut" icon={<Icon name="xplat-copy" />} />
			<Button label="Paste" icon={<Icon name="xplat-copy" />} />
		</ButtonGroup>
		<ButtonGroup label="Save options">
			<Button label="Save" variant="primary" />
			<IconButton label="Save options" variant="primary" icon={<Icon name="xplat-chevron-down" />} />
		</ButtonGroup>
	</Stack>
}
