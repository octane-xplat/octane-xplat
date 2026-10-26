// Port of upstream SideNavItem/SideNavItemShowcase.tsx (Astryx 0.6.4, MIT).
import { Badge, Icon, SideNav, SideNavItem } from '@octane-xplat/ui'

export function SideNavItemShowcase() @{
	<SideNav>
		<SideNavItem label="Inbox" icon={<Icon name="sandbox-envelope" />} isSelected href="#" endContent={<Badge label="12" />} />
		<SideNavItem label="Documents" icon={<Icon name="sandbox-document-duplicate" />} href="#" />
		<SideNavItem label="Settings" icon={<Icon name="sandbox-cog" />} href="#" isDisabled />
	</SideNav>
}
