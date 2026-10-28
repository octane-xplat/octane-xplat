// Port of upstream MobileNav/MobileNavEndSideMobileNav.tsx (Astryx 0.6.4, MIT).
import { useState } from 'octane'
import { Button, Icon, MobileNav, SideNavItem, SideNavSection } from '@octane-xplat/ui'

export function MobileNavEndSideMobileNav() @{
	const [isOpen, setIsOpen] = useState(false)

	<>
		<Button label="Open from Right" clickAction={() => setIsOpen(true)} />
		<MobileNav
			isOpen={isOpen}
			onOpenChange={(open: boolean) => setIsOpen(open)}
			header="Settings"
			side="end"
		>
			<SideNavSection title="Settings">
				<SideNavItem label="General" icon={<Icon name="sandbox-cog" />} href="/settings" />
				<SideNavItem label="Team" icon={<Icon name="sandbox-user" />} href="/team" />
			</SideNavSection>
		</MobileNav>
	</>
}
