// Port of upstream ButtonGroup/ButtonGroupFloating.tsx (Astryx 0.6.4, MIT).
import { Button, ButtonGroup, Stack, Text } from '@octane-xplat/ui'

export function ButtonGroupFloating() @{
	<Stack direction="vertical" gap={3} hAlign="start">
		<Text type="supporting" color="secondary">
			The whole group shares one raised surface — a floating action bar
		</Text>
		<ButtonGroup label="Zoom controls" elevation="med">
			<Button label="Zoom out" />
			<Button label="Reset" />
			<Button label="Zoom in" />
		</ButtonGroup>
	</Stack>
}
