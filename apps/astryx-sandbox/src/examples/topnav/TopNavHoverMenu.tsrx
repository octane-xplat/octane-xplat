// Port of upstream TopNav/TopNavHoverMenu.tsx (Astryx 0.6.4, MIT).
import { Icon, TopNav, TopNavHeading, TopNavItem, TopNavMenu } from '@octane-xplat/ui'

export function TopNavHoverMenu() @{
	<TopNav
		style={{ width: 600 }}
		label="Main navigation"
		heading={<TopNavHeading heading="Platform" />}
		startContent={
			<>
				<TopNavItem label="Home" href="#" isSelected />
				<TopNavMenu
					label="Products"
					items={[
						{ title: 'Analytics', description: 'Real-time traffic data', icon: <Icon name="sandbox-chart" />, href: '#analytics' },
						{ title: 'Engagement', description: 'Session metrics', icon: <Icon name="sandbox-chart" />, href: '#engagement' },
						{ title: 'Revenue', description: 'Sales tracking', icon: <Icon name="sandbox-chart" />, href: '#revenue' },
					]}
				/>
			</>
		}
	/>
}
