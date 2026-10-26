// Port of upstream NavHeadingMenu/NavHeadingMenuShowcase.tsx (Astryx 0.6.4, MIT).
import { Icon, NavHeadingMenu, NavHeadingMenuItem, NavIcon, SideNav, SideNavHeading } from '@octane-xplat/ui'

export function NavHeadingMenuShowcase() @{
	<div style={{ height: 100 }}>
		<SideNav
			header={
				<SideNavHeading
					heading="Acme Platform"
					icon={<NavIcon icon={<Icon name="sandbox-blocks" size={20} />} />}
					menu={
						<NavHeadingMenu size="lg">
							<NavHeadingMenuItem label="Dashboard" href="/dashboard" />
							<NavHeadingMenuItem label="Analytics" href="/analytics" />
							<NavHeadingMenuItem label="Settings" href="/settings" />
						</NavHeadingMenu>
					}
				/>
			}
		>
			{null}
		</SideNav>
	</div>
}
