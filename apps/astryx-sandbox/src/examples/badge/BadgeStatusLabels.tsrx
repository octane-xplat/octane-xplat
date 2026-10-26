// Port of upstream Badge/BadgeStatusLabels.tsx (Astryx 0.6.4, MIT).
import { Badge, Stack, Text } from '@octane-xplat/ui'

export function BadgeStatusLabels() @{
	<Stack direction="vertical" gap={6}>
		<Stack direction="vertical" gap={2}>
			<Text type="supporting" color="secondary">System status</Text>
			<Stack direction="horizontal" gap={2} vAlign="center">
				<Badge variant="success" label="Active" />
				<Badge variant="warning" label="Pending" />
				<Badge variant="error" label="Failed" />
			</Stack>
		</Stack>
		<Stack direction="vertical" gap={2}>
			<Text type="supporting" color="secondary">Workflow</Text>
			<Stack direction="horizontal" gap={2} vAlign="center">
				<Badge variant="neutral" label="Draft" />
				<Badge variant="info" label="In Review" />
			</Stack>
		</Stack>
	</Stack>
}
