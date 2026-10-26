// Port of upstream TopNav/TopNavMegaMenu.tsx (Astryx 0.6.4, MIT).
import { Icon, TopNav, TopNavHeading, TopNavItem, TopNavMegaMenu as MegaMenu, TopNavMegaMenuItem } from '@octane-xplat/ui'

export function TopNavMegaMenu() @{
	<TopNav
		style={{ width: 600 }}
		label="Main navigation"
		heading={<TopNavHeading heading="DevTools" />}
		startContent={
			<>
				<TopNavItem label="Overview" href="#" isSelected />
				<MegaMenu
					label="Products"
					items={
						<>
							<TopNavMegaMenuItem title="Deploy" description="Ship to production in seconds" icon={<Icon name="sandbox-arrow-up" />} href="#deploy" />
							<TopNavMegaMenuItem title="Documentation" description="Guides, references, and tutorials" icon={<Icon name="sandbox-code" />} href="#docs" />
							<TopNavMegaMenuItem title="Security" description="Protect your app" icon={<Icon name="sandbox-lock" />} href="#security" />
							<TopNavMegaMenuItem title="Search" description="Instant full-text search" icon={<Icon name="xplat-search" />} href="#search" />
						</>
					}
				/>
			</>
		}
	/>
}
