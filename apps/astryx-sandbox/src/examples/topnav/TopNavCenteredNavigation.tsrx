// Port of upstream TopNav/TopNavCenteredNavigation.tsx (Astryx 0.6.4, MIT).
import { Button, Icon, NavIcon, TopNav, TopNavHeading, TopNavItem } from '@octane-xplat/ui'

export function TopNavCenteredNavigation() @{
	<TopNav
		label="Main navigation"
		heading={<TopNavHeading heading="My App" logo={<NavIcon icon={<Icon name="sandbox-blocks" size={16} />} />} headingHref="#" />}
		centerContent={
			<>
				<TopNavItem label="Home" href="#" isSelected />
				<TopNavItem label="Products" href="#" />
				<TopNavItem label="About" href="#" />
			</>
		}
		endContent={
			<>
				<Button label="Search" variant="ghost" icon={<Icon name="xplat-search" color="inherit" />} isIconOnly />
				<Button label="Profile" variant="ghost" icon={<Icon name="sandbox-user" color="inherit" />} isIconOnly />
			</>
		}
	/>
}
