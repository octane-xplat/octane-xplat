// Port of upstream TopNav/TopNavMultipleDropdowns.tsx (Astryx 0.6.4, MIT).
import { Icon, TopNav, TopNavHeading, TopNavItem, TopNavMenu } from '@octane-xplat/ui'

export function TopNavMultipleDropdowns() @{
	<TopNav
		style={{ width: 600 }}
		label="Main navigation"
		heading={<TopNavHeading heading="Console" />}
		startContent={
			<>
				<TopNavItem label="Home" href="#" isSelected />
				<TopNavMenu
					label="Compute"
					items={[
						{ title: 'Instances', description: 'Virtual machines', icon: <Icon name="sandbox-app-window" />, href: '#instances' },
						{ title: 'Functions', description: 'Serverless compute', icon: <Icon name="sandbox-app-window" />, href: '#functions' },
					]}
				/>
				<TopNavMenu
					label="Storage"
					items={[
						{ title: 'Buckets', description: 'Object storage', icon: <Icon name="sandbox-folder" />, href: '#buckets' },
						{ title: 'Volumes', description: 'Block storage', icon: <Icon name="sandbox-folder" />, href: '#volumes' },
					]}
				/>
				<TopNavMenu
					label="Networking"
					items={[
						{ title: 'Load balancers', description: 'Distribute traffic', icon: <Icon name="sandbox-globe" />, href: '#lb' },
						{ title: 'DNS', description: 'Domain management', icon: <Icon name="sandbox-globe" />, href: '#dns' },
					]}
				/>
			</>
		}
	/>
}
