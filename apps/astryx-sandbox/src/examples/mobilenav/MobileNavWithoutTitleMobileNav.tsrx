// Port of upstream MobileNav/MobileNavWithoutTitleMobileNav.tsx (Astryx 0.6.4, MIT).
import { useState } from 'octane'
import { Button, Icon, MobileNav, SideNavItem, SideNavSection } from '@octane-xplat/ui'

export function MobileNavWithoutTitleMobileNav() @{
	const [isOpen, setIsOpen] = useState(false)
	<>
		<Button label="Open Navigation" icon={<Icon name="sandbox-menu" color="inherit" />} variant="ghost" clickAction={() => setIsOpen(true)} isIconOnly />
		<MobileNav isOpen={isOpen} onOpenChange={(open: boolean) => setIsOpen(open)} label="Navigation drawer">
			<SideNavSection title="Main" isHeaderHidden>
				<SideNavItem label="Dashboard" icon={<Icon name="sandbox-home" />} isSelected href="/" />
				<SideNavItem label="Projects" icon={<Icon name="sandbox-folder" />} href="/projects" />
				<SideNavItem label="Settings" icon={<Icon name="sandbox-cog" />} href="/settings" />
			</SideNavSection>
		</MobileNav>
	</>
}
