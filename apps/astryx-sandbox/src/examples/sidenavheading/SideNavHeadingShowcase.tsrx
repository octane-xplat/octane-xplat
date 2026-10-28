// Port of upstream SideNavHeading/SideNavHeadingShowcase.tsx (Astryx 0.6.4, MIT).
import { HStack, Icon, NavIcon, SideNav, SideNavHeading } from '@octane-xplat/ui'

export function SideNavHeadingShowcase() @{
	<HStack gap={6}>
		<SideNav
			header={
				<SideNavHeading
					heading="Analytics"
					icon={<NavIcon icon={<Icon name="sandbox-blocks" size={20} />} />}
					headingHref="/"
				/>
			}
		>
			{null}
		</SideNav>
		<SideNav
			header={
				<SideNavHeading
					heading="Analytics"
					icon={<NavIcon icon={<Icon name="sandbox-blocks" size={20} />} />}
					superheading="Acme Corp"
					subheading="Production"
					headingHref="/"
				/>
			}
		>
			{null}
		</SideNav>
	</HStack>
}
