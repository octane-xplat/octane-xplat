// Port of upstream TopNav/TopNavShowcase.tsx (Astryx 0.6.4, MIT).
import { Icon, NavIcon, TopNav, TopNavHeading, TopNavItem } from '@octane-xplat/ui'

export function TopNavShowcase() @{
	<TopNav
		label="Main navigation"
		heading={<TopNavHeading heading="My App" logo={<NavIcon icon={<Icon name="sandbox-blocks" size={16} />} />} headingHref="#" />}
		startContent={
			<>
				<TopNavItem label="Home" href="#" isSelected />
				<TopNavItem label="Products" href="#" />
				<TopNavItem label="Docs" href="#" />
			</>
		}
		endContent={<Icon name="xplat-search" />}
	/>
}
