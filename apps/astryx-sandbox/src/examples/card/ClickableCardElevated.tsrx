// Port of upstream Card/ClickableCardElevated.tsx (Astryx 0.6.4, MIT).
import { ClickableCard, Heading, Stack, Text } from '@octane-xplat/ui'

export function ClickableCardElevated() @{
	<ClickableCard label="Open report" href="#" elevation="med" width={320}>
		<Stack direction="vertical" gap={2}>
			<Heading level={4}>Quarterly report</Heading>
			<Text type="body" color="secondary">A raised shadow signals the whole card is clickable, lifting it above the surrounding content.</Text>
		</Stack>
	</ClickableCard>
}
