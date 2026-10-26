// Port of upstream TopNav/TopNavWithLogo.tsx (Astryx 0.6.4, MIT).
import { Icon, NavIcon, TopNav, TopNavHeading, TopNavItem } from '@octane-xplat/ui'

export function TopNavWithLogo() @{
	<TopNav
		label="Main navigation"
		heading={<TopNavHeading heading="Acme" logo={<NavIcon icon={<Icon name="sandbox-blocks" size={16} />} />} headingHref="#" />}
		startContent={
			<>
				<TopNavItem label="Overview" href="#" isSelected />
				<TopNavItem label="Pricing" href="#" />
			</>
		}
	/>
}
