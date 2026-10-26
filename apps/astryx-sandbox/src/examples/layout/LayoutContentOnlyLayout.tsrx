// Port of upstream Layout/LayoutContentOnlyLayout.tsx (Astryx 0.6.4, MIT).
import { Card, Heading, Layout, LayoutContent, Text, VStack } from '@octane-xplat/ui'

export function LayoutContentOnlyLayout() @{
	<Card width="100%" style={{ maxWidth: 400 }}>
		<Layout
			content={
				<LayoutContent>
					<VStack gap={3}>
						<Heading level={4}>Simple Content</Heading>
						<Text type="body">A layout can have just content without header or footer. This is useful for simple cards or content blocks that don't need structured sections.</Text>
					</VStack>
				</LayoutContent>
			}
		/>
	</Card>
}
