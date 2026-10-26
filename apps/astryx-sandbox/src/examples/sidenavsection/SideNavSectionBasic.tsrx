// Port of upstream SideNavSection/SideNavSectionBasic.tsx (Astryx 0.6.4, MIT).
import { Icon, SideNav, SideNavItem, SideNavSection } from '@octane-xplat/ui'

export function SideNavSectionBasic() @{
	<SideNav>
		<SideNavSection title="Overview">
			<SideNavItem label="Dashboard" icon={<Icon name="sandbox-home" />} isSelected href="#" />
			<SideNavItem label="Analytics" icon={<Icon name="sandbox-chart" />} href="#" />
		</SideNavSection>
		<SideNavSection title="Account">
			<SideNavItem label="Profile" icon={<Icon name="sandbox-user" />} href="#" />
		</SideNavSection>
	</SideNav>
}
