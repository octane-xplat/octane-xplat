// Port of upstream Card/CardWithSimpleContent.tsx (Astryx 0.6.4, MIT).
import { Card, Heading, Stack, Text } from '@octane-xplat/ui'

export function CardWithSimpleContent() @{
	<Card width={360}>
		<Stack direction="vertical" gap={2}>
			<Heading level={3}>Project Overview</Heading>
			<Text type="body" color="secondary">
				This project tracks the redesign of the onboarding flow. The goal is to reduce drop-off by
				15% in Q2.
			</Text>
			<Text type="supporting" color="secondary">
				Last updated 2 hours ago
			</Text>
		</Stack>
	</Card>
}
