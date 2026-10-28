// Port of upstream SideNav/SideNavShowcase.tsx (Astryx 0.6.4, MIT).
import { Icon, SideNav, SideNavHeading, SideNavItem, SideNavSection } from '@octane-xplat/ui'

export function SideNavShowcase() @{
	<SideNav header={<SideNavHeading heading="My App" headingHref="/" />}>
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
		<SideNavSection title="Documents">
			<SideNavItem
				label="All Documents"
				icon={<Icon name="sandbox-document-duplicate" />}
				href="/documents"
			/>
		</SideNavSection>
	</SideNav>
}
