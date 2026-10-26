// Port of upstream AppShell/AppShellShowcase.tsx (Astryx 0.6.4, MIT).
import { AppShell, Heading, Icon, NavIcon, SideNav, SideNavHeading, SideNavItem, SideNavSection, Text, VStack } from '@octane-xplat/ui'

export function AppShellShowcase() @{
	<AppShell
		contentPadding={6}
		style={{ height: '100%', minHeight: 0, width: '100%' }}
		sideNav={
			<SideNav
				header={
					<SideNavHeading
						icon={<NavIcon icon={<Icon name="sandbox-blocks" size={16} />} />}
						heading="App Shell"
						headingHref="#"
					/>
				}
			>
				<SideNavSection title="Main" isHeaderHidden>
					<SideNavItem label="Home" icon={<Icon name="sandbox-home" />} isSelected href="#" />
					<SideNavItem label="Reports" icon={<Icon name="sandbox-chart" />} href="#" />
					<SideNavItem label="Documents" icon={<Icon name="sandbox-document-duplicate" />} href="#" />
					<SideNavItem label="Team" icon={<Icon name="sandbox-user" />} href="#" />
				</SideNavSection>
			</SideNav>
		}
	>
		<VStack gap={4}>
			<Heading level={3}>Page Content</Heading>
			<Text type="body">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.</Text>
		</VStack>
	</AppShell>
}
