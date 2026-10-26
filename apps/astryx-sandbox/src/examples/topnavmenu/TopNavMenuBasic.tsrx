// Port of upstream TopNavMenu/TopNavMenuBasic.tsx (Astryx 0.6.4, MIT).
import { Icon, TopNav, TopNavHeading, TopNavItem, TopNavMenu } from '@octane-xplat/ui'

export function TopNavMenuBasic() @{
	<TopNav
		style={{ width: 600 }}
		label="Main navigation"
		heading={<TopNavHeading heading="Platform" />}
		startContent={
			<>
				<TopNavItem label="Home" href="#" isSelected />
				<TopNavMenu
					label="Tools"
					items={[
						{ title: 'Analytics', description: 'View traffic and engagement metrics', icon: <Icon name="sandbox-chart" />, href: '#analytics' },
						{ title: 'Settings', description: 'Configure your workspace', icon: <Icon name="sandbox-cog" />, href: '#settings' },
					]}
				/>
			</>
		}
	/>
}
