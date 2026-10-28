// Port of upstream Card/ClickableCardShowcase.tsx (Astryx 0.6.4, MIT).
import { ClickableCard, Heading, Stack, Text } from '@octane-xplat/ui'

export function ClickableCardShowcase() @{
	<ClickableCard label="Settings" href="#" width={320}>
		<Stack direction="vertical" gap={2}>
			<Heading level={4}>Settings</Heading>
			<Text type="body" color="secondary">
				Click anywhere on this card to navigate. Nested buttons and links work independently.
			</Text>
		</Stack>
	</ClickableCard>
}
