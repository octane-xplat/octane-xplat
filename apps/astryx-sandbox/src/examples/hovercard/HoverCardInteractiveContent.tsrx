// Port of upstream HoverCard/HoverCardInteractiveContent.tsx (Astryx 0.6.4, MIT).
import { HStack, HoverCard, Icon, Link, Text, VStack } from '@octane-xplat/ui'

export function HoverCardInteractiveContent() @{
	<Text type="body">
		Read more in the{' '}
		<HoverCard
			placement="below"
			content={
				<VStack gap={2} style={{ maxWidth: 280 }}>
					<HStack gap={2} vAlign="start">
						<Icon name="sandbox-external-link" size={16} color="secondary" />
						<VStack gap={1}>
							<Text type="label">Getting Started Guide</Text>
							<Text type="body" color="secondary">Learn how to set up your first project, invite team members, and configure your workspace.</Text>
							<Text type="supporting" color="secondary">docs.example.com/getting-started</Text>
						</VStack>
					</HStack>
				</VStack>
			}
		>
			<Link href="#" hasUnderline>Getting Started Guide</Link>
		</HoverCard>
		.
	</Text>
}
