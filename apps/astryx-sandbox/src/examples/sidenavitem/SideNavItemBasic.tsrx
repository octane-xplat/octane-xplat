// Port of upstream SideNavItem/SideNavItemBasic.tsx (Astryx 0.6.4, MIT).
import { Icon, SideNav, SideNavItem } from '@octane-xplat/ui'

export function SideNavItemBasic() @{
	<SideNav>
		<SideNavItem label="Inbox" icon={<Icon name="sandbox-envelope" />} isSelected href="#" />
		<SideNavItem label="Documents" icon={<Icon name="sandbox-document-duplicate" />} href="#" />
	</SideNav>
}
