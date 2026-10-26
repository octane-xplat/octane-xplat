// Port of upstream SideNav/SideNavWithHeaderMenu.tsx (Astryx 0.6.4, MIT).
import { Icon, ListItem, NavIcon, SideNav, SideNavHeading, SideNavItem, SideNavSection } from '@octane-xplat/ui'

export function SideNavWithHeaderMenu() @{
	<SideNav
		header={
			<SideNavHeading
				icon={<NavIcon icon={<Icon name="sandbox-blocks" size={16} />} />}
				heading="Product Name"
				subheading="Business Account"
				menu={
					<>
						<ListItem label="Personal Account" href="#" />
						<ListItem label="Acme Corp" href="#" />
						<ListItem label="Add account" href="#" />
						<ListItem label="Sign out" href="#" />
					</>
				}
			/>
		}
	>
		<SideNavSection title="Main">
			<SideNavItem label="Dashboard" icon={<Icon name="sandbox-home" />} isSelected />
			<SideNavItem label="Settings" icon={<Icon name="sandbox-cog" />} />
		</SideNavSection>
	</SideNav>
}
