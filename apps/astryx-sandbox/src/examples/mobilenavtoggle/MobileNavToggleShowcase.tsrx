// Port of upstream MobileNavToggle/MobileNavToggleShowcase.tsx (Astryx 0.6.4, MIT).
import { useState } from 'octane'
import { AppShellMobileContext, HStack, MobileNav, MobileNavToggle, SideNavItem, SideNavSection, Text } from '@octane-xplat/ui'

export function MobileNavToggleShowcase() @{
	const [isOpen, setIsOpen] = useState(false)
	<AppShellMobileContext
		value={{
			isMobile: true,
			isMobileNavOpen: isOpen,
			toggleMobileNav: () => setIsOpen((v: boolean) => !v),
			openMobileNav: () => setIsOpen(true),
			closeMobileNav: () => setIsOpen(false),
			isMobileNavEnabled: true,
			hasAutoToggle: false,
		}}
	>
		<HStack gap={3} vAlign="center">
			<MobileNavToggle />
			<Text type="body" weight="bold">Page title</Text>
		</HStack>
		<MobileNav isOpen={isOpen} onOpenChange={setIsOpen} header="Navigation">
			<SideNavSection title="Pages">
				<SideNavItem label="Home" isSelected href="#" />
				<SideNavItem label="Settings" href="#" />
			</SideNavSection>
		</MobileNav>
	</AppShellMobileContext>
}
