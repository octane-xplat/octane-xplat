// Port of upstream SideNavCollapseButton/SideNavCollapseButtonBasic.tsx (Astryx 0.6.4, MIT).
import { Icon, SideNav, SideNavCollapseButton, SideNavItem } from '@octane-xplat/ui'

export function SideNavCollapseButtonBasic() @{
	<SideNav collapsible={{ hasButton: false }} footerIcons={<SideNavCollapseButton />}>
		<SideNavItem label="Home" icon={<Icon name="sandbox-home" />} isSelected href="#" />
		<SideNavItem label="Projects" icon={<Icon name="sandbox-folder" />} href="#" />
	</SideNav>
}
