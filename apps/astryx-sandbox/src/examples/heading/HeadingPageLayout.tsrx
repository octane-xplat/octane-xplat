// Port of upstream Heading/HeadingPageLayout.tsx (Astryx 0.6.4, MIT).
import { Heading, Text, VStack } from '@octane-xplat/ui'

export function HeadingPageLayout() @{
	<VStack gap={6} width="100%" style={{ maxWidth: 400 }}>
		<VStack>
			<Heading level={1}>Dashboard Overview</Heading>
			<Text type="supporting" className="sb-block">Last updated 5 minutes ago</Text>
		</VStack>
		<VStack>
			<Heading level={2}>Recent Activity</Heading>
			<Text type="body" className="sb-block">Here's what's been happening in your workspace.</Text>
		</VStack>
	</VStack>
}
