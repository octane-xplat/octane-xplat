// Port of upstream SideNavHeading/SideNavHeadingBasic.tsx (Astryx 0.6.4, MIT).
import { NavIcon, Icon, SideNav, SideNavHeading } from '@octane-xplat/ui'

export function SideNavHeadingBasic() @{
	<SideNav header={<SideNavHeading heading="Analytics" icon={<NavIcon icon={<Icon name="sandbox-blocks" size={20} />} />} headingHref="/" />}>
		{null}
	</SideNav>
}
