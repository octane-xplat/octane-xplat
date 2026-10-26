// Port of upstream TopNavMegaMenu/TopNavMegaMenuBasic.tsx (Astryx 0.6.4, MIT).
import { Icon, TopNav, TopNavHeading, TopNavItem, TopNavMegaMenu, TopNavMegaMenuItem } from '@octane-xplat/ui'

export function TopNavMegaMenuBasic() @{
	<TopNav
		style={{ width: 600 }}
		label="Main navigation"
		heading={<TopNavHeading heading="DevTools" />}
		startContent={
			<>
				<TopNavItem label="Overview" href="#" isSelected />
				<TopNavMegaMenu
					label="Products"
					items={
						<>
							<TopNavMegaMenuItem title="Deploy" description="Ship to production in seconds" icon={<Icon name="sandbox-arrow-up" size={20} />} href="#deploy" />
							<TopNavMegaMenuItem title="Documentation" description="Guides, references, and tutorials" icon={<Icon name="sandbox-code" size={20} />} href="#docs" />
						</>
					}
				/>
			</>
		}
	/>
}
