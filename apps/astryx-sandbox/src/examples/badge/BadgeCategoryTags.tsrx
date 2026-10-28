// Port of upstream Badge/BadgeCategoryTags.tsx (Astryx 0.6.4, MIT).
import { Badge, Stack, Text } from '@octane-xplat/ui'

export function BadgeCategoryTags() @{
	<Stack direction="vertical" gap={6}>
		<Stack direction="vertical" gap={2}>
			<Text type="supporting" color="secondary">
				Teams
			</Text>
			<Stack direction="horizontal" gap={2} wrap="wrap">
				<Badge variant="blue" label="Design" />
				<Badge variant="cyan" label="DevOps" />
				<Badge variant="green" label="Backend" />
				<Badge variant="pink" label="Marketing" />
				<Badge variant="purple" label="Engineering" />
				<Badge variant="teal" label="Research" />
			</Stack>
		</Stack>
		<Stack direction="vertical" gap={2}>
			<Text type="supporting" color="secondary">
				Priority
			</Text>
			<Stack direction="horizontal" gap={2}>
				<Badge variant="orange" label="Urgent" />
				<Badge variant="red" label="Critical" />
				<Badge variant="yellow" label="Review" />
			</Stack>
		</Stack>
	</Stack>
}
