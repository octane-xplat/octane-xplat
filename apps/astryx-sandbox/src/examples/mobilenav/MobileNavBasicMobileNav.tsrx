// Port of upstream MobileNav/MobileNavBasicMobileNav.tsx (Astryx 0.6.4, MIT).
import { useState } from 'octane'
import { Button, Icon, MobileNav, SideNavItem, SideNavSection } from '@octane-xplat/ui'

export function MobileNavBasicMobileNav() @{
	const [isOpen, setIsOpen] = useState(false)

	<>
		<Button
			label="Open Navigation"
			icon={<Icon name="sandbox-menu" color="inherit" />}
			variant="ghost"
			clickAction={() => setIsOpen(true)}
			isIconOnly
		/>
		<MobileNav
			isOpen={isOpen}
			onOpenChange={(open: boolean) => setIsOpen(open)}
			header="Navigation"
		>
			<SideNavSection title="Main">
				<SideNavItem
					label="Dashboard"
					icon={<Icon name="sandbox-home" />}
					isSelected
					href="/dashboard"
				/>
				<SideNavItem label="Projects" icon={<Icon name="sandbox-folder" />} href="/projects" />
				<SideNavItem label="Analytics" icon={<Icon name="sandbox-chart" />} href="/analytics" />
			</SideNavSection>
			<SideNavSection title="Settings">
				<SideNavItem label="General" icon={<Icon name="sandbox-cog" />} href="/settings" />
				<SideNavItem label="Team" icon={<Icon name="sandbox-user" />} href="/team" />
			</SideNavSection>
		</MobileNav>
	</>
}
