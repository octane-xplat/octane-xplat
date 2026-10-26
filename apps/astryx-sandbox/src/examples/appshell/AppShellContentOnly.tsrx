// Port of upstream AppShell/AppShellContentOnly.tsx (Astryx 0.6.4, MIT).
import { AppShell, Heading, Text, VStack } from '@octane-xplat/ui'

export function AppShellContentOnly() @{
	<AppShell contentPadding={6} style={{ height: '100%', minHeight: 0 }}>
		<VStack gap={4}>
			<Heading level={3}>Page Content</Heading>
			<Text type="body">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.</Text>
		</VStack>
	</AppShell>
}
