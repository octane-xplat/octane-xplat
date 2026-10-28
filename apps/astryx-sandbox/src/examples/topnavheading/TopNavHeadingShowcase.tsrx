// Port of upstream TopNavHeading/TopNavHeadingShowcase.tsx (Astryx 0.6.4, MIT).
import { Icon, NavIcon, TopNav, TopNavHeading, VStack } from '@octane-xplat/ui'

export function TopNavHeadingShowcase() @{
	<VStack gap={4}>
		<TopNav
			label="Plain heading example"
			heading={
				<TopNavHeading
					heading="Acme Platform"
					logo={<NavIcon icon={<Icon name="sandbox-blocks" size={20} />} />}
				/>
			}
		/>
		<TopNav
			label="Linked heading example"
			heading={
				<TopNavHeading
					heading="Acme Platform"
					logo={<Icon name="sandbox-blocks" size={20} />}
					headingHref="/"
				/>
			}
		/>
	</VStack>
}
