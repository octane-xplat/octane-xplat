// Port of upstream Button/ButtonWithIcon.tsx (Astryx 0.6.4, MIT).
import { Button, Stack, Text } from '@octane-xplat/ui'

export function ButtonWithIcon() @{
	return (
		<Stack direction="vertical" gap={4}>
			<Text className="sb-type-supporting sb-color-secondary">
				Icons reinforce the action
			</Text>
			<Stack direction="horizontal" gap={3} vAlign="center">
				<Button label="New item" variant="primary" icon="sandbox-plus" />
				<Button label="Edit" variant="secondary" icon="sandbox-pencil-square" />
				<Button label="Download" variant="ghost" icon="sandbox-arrow-down-tray" />
				<Button label="Delete" variant="destructive" icon="sandbox-trash" />
			</Stack>
		</Stack>
	)
}
