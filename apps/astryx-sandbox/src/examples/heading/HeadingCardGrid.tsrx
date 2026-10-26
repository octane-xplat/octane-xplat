// Port of upstream Heading/HeadingCardGrid.tsx (Astryx 0.6.4, MIT).
import { Card, Heading, Text, VStack } from '@octane-xplat/ui'

export function HeadingCardGrid() @{
	<Card width={300}>
		<VStack gap={2}>
			<Heading level={3}>Card Title</Heading>
			<Text type="body" maxLines={2} className="sb-block">This is a card description that might be quite long and needs to be truncated after two lines to keep the card compact and uniform.</Text>
			<Text type="supporting" className="sb-block">Updated 1 hour ago</Text>
		</VStack>
	</Card>
}
