// Port of upstream SideNav/SideNavEndContent.tsx (Astryx 0.6.4, MIT).
import {
	Badge,
	Icon,
	MoreMenu,
	SideNav,
	SideNavHeading,
	SideNavItem,
	SideNavSection,
	Text,
} from '@octane-xplat/ui'

export function SideNavEndContent() @{
	<SideNav header={<SideNavHeading heading="My App" headingHref="/" />}>
		<SideNavSection title="Navigation" isHeaderHidden>
			<SideNavItem
				label="Dashboard"
				icon={<Icon name="sandbox-home" />}
				isSelected
				href="/dashboard"
				endContent={
					<MoreMenu
						size="sm"
						items={[
							{ type: 'action', key: 'pin', label: 'Pin to top', onSelect: () => {} },
							{ type: 'action', key: 'rename', label: 'Rename', onSelect: () => {} },
						]}
					/>
				}
			/>
			<SideNavItem
				label="Projects"
				icon={<Icon name="sandbox-folder" />}
				href="/projects"
				endContent={<Badge label={12} />}
			/>
			<SideNavItem
				label="Analytics"
				icon={<Icon name="sandbox-chart" />}
				href="/analytics"
				endContent={<Badge label="New" />}
			/>
			<SideNavItem
				label="Team"
				icon={<Icon name="sandbox-user" />}
				href="/team"
				endContent={
					<Text type="supporting" color="secondary">
						8 members
					</Text>
				}
			/>
		</SideNavSection>
	</SideNav>
}
