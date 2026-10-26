// Port of upstream TopNavItem/TopNavItemBasic.tsx (Astryx 0.6.4, MIT).
import { TopNav, TopNavHeading, TopNavItem } from '@octane-xplat/ui'

export function TopNavItemBasic() @{
	<TopNav
		label="Main navigation"
		heading={<TopNavHeading heading="App" />}
		startContent={
			<>
				<TopNavItem label="Dashboard" href="#" isSelected />
				<TopNavItem label="Projects" href="#" />
				<TopNavItem label="Reports" href="#" />
			</>
		}
	/>
}
