// Port of upstream TopNav/TopNavEnterpriseDashboard.tsx (Astryx 0.6.4, MIT).
import {
	Avatar,
	Badge,
	Icon,
	IconButton,
	NavIcon,
	TopNav,
	TopNavHeading,
	TopNavItem,
} from '@octane-xplat/ui'

export function TopNavEnterpriseDashboard() @{
	<TopNav
		label="Main navigation"
		heading={
			<TopNavHeading
				heading="My App"
				logo={<NavIcon icon={<Icon name="sandbox-blocks" size={16} />} />}
				headingHref="#"
			/>
		}
		startContent={
			<>
				<TopNavItem label="Dashboard" href="#" isSelected />
				<TopNavItem label="Projects" href="#" />
				<TopNavItem label="Reports" href="#" />
				<TopNavItem label="Team" href="#" />
			</>
		}
		endContent={
			<>
				<IconButton label="Notifications" icon={<Icon name="sandbox-bell" />} variant="ghost" />
				<IconButton label="Settings" icon={<Icon name="sandbox-cog" />} variant="ghost" />
				<Avatar name="Sam Rivera" size="sm" />
			</>
		}
	/>
}
