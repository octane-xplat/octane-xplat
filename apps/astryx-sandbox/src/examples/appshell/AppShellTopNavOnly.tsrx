// Port of upstream AppShell/AppShellTopNavOnly.tsx (Astryx 0.6.4, MIT).
import {
	AppShell,
	Heading,
	Icon,
	NavIcon,
	Text,
	TopNav,
	TopNavHeading,
	TopNavItem,
	VStack,
} from '@octane-xplat/ui'

export function AppShellTopNavOnly() @{
	<AppShell
		contentPadding={6}
		style={{ height: '100%', minHeight: 0 }}
		topNav={
			<TopNav
				label="Main navigation"
				heading={
					<TopNavHeading
						heading="App Shell"
						logo={<NavIcon icon={<Icon name="sandbox-blocks" size={16} />} />}
					/>
				}
				startContent={
					<>
						<TopNavItem label="Home" href="#" isSelected />
						<TopNavItem label="Products" href="#" />
						<TopNavItem label="Docs" href="#" />
					</>
				}
			/>
		}
	>
		<VStack gap={4}>
			<Heading level={3}>Page Content</Heading>
			<Text type="body">
				Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut
				labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco
				laboris.
			</Text>
		</VStack>
	</AppShell>
}
