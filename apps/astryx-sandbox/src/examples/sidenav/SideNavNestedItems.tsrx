// Port of upstream SideNav/SideNavNestedItems.tsx (Astryx 0.6.4, MIT).
import { Icon, SideNav, SideNavHeading, SideNavItem, SideNavSection } from '@octane-xplat/ui'

export function SideNavNestedItems() @{
	<SideNav header={<SideNavHeading heading="My App" />}>
		<SideNavSection title="Main">
			<SideNavItem label="Dashboard" icon={<Icon name="sandbox-home" />} isSelected />
			<SideNavItem label="Settings" icon={<Icon name="sandbox-cog" />}>
				<SideNavItem label="General" href="/settings/general" />
				<SideNavItem label="Security" href="/settings/security" />
				<SideNavItem label="Notifications" href="/settings/notifications" />
			</SideNavItem>
		</SideNavSection>
	</SideNav>
}
