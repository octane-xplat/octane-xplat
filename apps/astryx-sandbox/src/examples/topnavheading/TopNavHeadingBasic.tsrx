// Port of upstream TopNavHeading/TopNavHeadingBasic.tsx (Astryx 0.6.4, MIT).
import { Icon, NavIcon, TopNav, TopNavHeading } from '@octane-xplat/ui'

export function TopNavHeadingBasic() @{
	<TopNav
		label="Product navigation"
		heading={<TopNavHeading heading="Acme Platform" logo={<NavIcon icon={<Icon name="sandbox-view-columns" />} />} headingHref="/" />}
	/>
}
