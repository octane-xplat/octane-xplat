// Port of upstream Card/CardCallout.tsx (Astryx 0.6.4, MIT).
import { Card, Heading, Stack, Text } from '@octane-xplat/ui'

export function CardCallout() @{
	<Stack direction="horizontal" gap={4}>
		<Card width={270} variant="muted">
			<Stack direction="vertical" gap={2}>
				<Heading level={3}>Tip</Heading>
				<Text type="body" color="secondary">Use the muted variant for callouts or supplementary information.</Text>
			</Stack>
		</Card>
		<Card width={270} variant="muted">
			<Stack direction="vertical" gap={2}>
				<Heading level={3}>Note</Heading>
				<Text type="body" color="secondary">Muted cards work well in sidebars or help panels.</Text>
			</Stack>
		</Card>
	</Stack>
}
