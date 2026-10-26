// Port of upstream HoverCard/HoverCardProfileHoverCard.tsx (Astryx 0.6.4, MIT).
import { Avatar, Heading, HStack, HoverCard, Icon, Link, Text, VStack } from '@octane-xplat/ui'

export function HoverCardProfileHoverCard() @{
	<HoverCard
		placement="below"
		content={
			<HStack gap={3} vAlign="start" style={{ maxWidth: 280 }}>
				<Avatar name="Jane Doe" size={48} style={{ flexShrink: 0 }} />
				<VStack gap={1}>
					<Heading level={3}>@janedoe</Heading>
					<Text type="body" color="secondary">Crafting accessible, scalable design systems for modern teams.</Text>
					<HStack gap={1} vAlign="center">
						<Icon name="xplat-calendar" size={12} color="secondary" />
						<Text type="supporting" color="secondary">March 2024</Text>
					</HStack>
				</VStack>
			</HStack>
		}
	>
		<Link href="#" hasUnderline>@janedoe</Link>
	</HoverCard>
}
