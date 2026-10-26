// Port of upstream AppShell/AppShellWithBanner.tsx (Astryx 0.6.4, MIT).
import { AppShell, Banner, Heading, Icon, NavIcon, SideNav, SideNavItem, SideNavSection, Text, TopNav, TopNavHeading, TopNavItem, VStack } from '@octane-xplat/ui'

export function AppShellWithBanner() @{
	<AppShell
		contentPadding={6}
		style={{ height: '100%', minHeight: 0 }}
		topNav={
			<TopNav
				label="Main navigation"
				heading={<TopNavHeading heading="App Shell" logo={<NavIcon icon={<Icon name="sandbox-blocks" size={16} />} />} />}
				startContent={
					<>
						<TopNavItem label="Home" href="#" isSelected />
						<TopNavItem label="Products" href="#" />
						<TopNavItem label="Docs" href="#" />
					</>
				}
			/>
		}
		sideNav={
			<SideNav>
				<SideNavSection title="Main" isHeaderHidden>
					<SideNavItem label="Dashboard" icon={<Icon name="sandbox-home" />} isSelected href="#" />
					<SideNavItem label="Analytics" icon={<Icon name="sandbox-chart" />} href="#" />
					<SideNavItem label="Projects" icon={<Icon name="sandbox-folder" />} href="#" />
				</SideNavSection>
				<SideNavSection title="Organization">
					<SideNavItem label="Team" icon={<Icon name="sandbox-user" />} href="#" />
					<SideNavItem label="Settings" icon={<Icon name="sandbox-cog" />} href="#" />
				</SideNavSection>
			</SideNav>
		}
		banner={
			<Banner
				status="info"
				container="section"
				title="System maintenance scheduled"
				description="The system will undergo maintenance tonight at 10pm UTC."
				isDismissable
			/>
		}
	>
		<VStack gap={4}>
			<Heading level={3}>Page Content</Heading>
			<Text type="body">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.</Text>
		</VStack>
	</AppShell>
}
