// Port of upstream TopNavMenu/TopNavMenuShowcase.tsx (Astryx 0.6.4, MIT).
import { Icon, TopNav, TopNavHeading, TopNavItem, TopNavMenu } from '@octane-xplat/ui'

export function TopNavMenuShowcase() @{
	<TopNav
		style={{ width: 600 }}
		label="Menu demo"
		heading={<TopNavHeading heading="Platform" />}
		startContent={
			<>
				<TopNavItem label="Home" href="#" isSelected />
				<TopNavMenu
					label="Platform"
					items={[
						{ title: 'Analytics', description: 'Dashboards and reports', icon: <Icon name="sandbox-chart" />, href: '#analytics' },
						{ title: 'Search', description: 'Full-text search', icon: <Icon name="xplat-search" />, href: '#search' },
						{ title: 'Users', description: 'Team management', icon: <Icon name="sandbox-user" />, href: '#users' },
						{ title: 'Settings', description: 'Workspace config', icon: <Icon name="sandbox-cog" />, href: '#settings' },
					]}
				/>
			</>
		}
	/>
}
