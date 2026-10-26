// Port of upstream Card/CardShowcase.tsx (Astryx 0.6.4, MIT).
import { Card, Heading, Stack, Text } from '@octane-xplat/ui'

export function CardShowcase() @{
	<Card width={320}>
		<Stack direction="vertical" gap={2}>
			<Heading level={4}>Card title</Heading>
			<Text type="body" color="secondary">Cards group related content with a border and background. Use them for profiles, settings panels, or data summaries.</Text>
		</Stack>
	</Card>
}
