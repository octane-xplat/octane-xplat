// Port of upstream SideNavCollapseButton/SideNavCollapseButtonShowcase.tsx (Astryx 0.6.4, MIT).
import {
	Icon,
	SideNav,
	SideNavCollapseButton,
	SideNavHeading,
	SideNavItem,
	SideNavSection,
} from '@octane-xplat/ui'

export function SideNavCollapseButtonShowcase() @{
	<SideNav
		collapsible={{ hasButton: false }}
		header={<SideNavHeading heading="Workspace" />}
		footerIcons={<SideNavCollapseButton />}
	>
		<SideNavSection title="Main">
			<SideNavItem label="Home" icon={<Icon name="sandbox-home" />} isSelected href="#" />
			<SideNavItem label="Projects" icon={<Icon name="sandbox-folder" />} href="#" />
		</SideNavSection>
	</SideNav>
}
