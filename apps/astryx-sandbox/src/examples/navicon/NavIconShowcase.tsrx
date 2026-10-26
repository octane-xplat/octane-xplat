// Port of upstream NavIcon/NavIconShowcase.tsx (Astryx 0.6.4, MIT).
import { HStack, Icon, NavIcon } from '@octane-xplat/ui'

export function NavIconShowcase() @{
	<HStack gap={4} vAlign="center">
		<NavIcon icon={<Icon name="xplat-search" />} />
		<NavIcon icon={<Icon name="xplat-calendar" />} />
		<NavIcon icon={<Icon name="xplat-wrench" />} />
	</HStack>
}
