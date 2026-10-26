// Port of upstream TopNavItem/TopNavItemShowcase.tsx (Astryx 0.6.4, MIT).
import { Icon, TopNav, TopNavHeading, TopNavItem } from '@octane-xplat/ui'

export function TopNavItemShowcase() @{
	<TopNav
		style={{ width: 600 }}
		label="Navigation items demo"
		heading={<TopNavHeading heading="App" />}
		startContent={
			<>
				<TopNavItem label="Dashboard" href="#" isSelected icon={<Icon name="sandbox-home" size={16} />} />
				<TopNavItem label="Projects" href="#" />
				<TopNavItem label="Reports" href="#" />
				<TopNavItem label="Archived" href="#" isDisabled />
			</>
		}
		endContent={<Icon name="xplat-search" />}
	/>
}
