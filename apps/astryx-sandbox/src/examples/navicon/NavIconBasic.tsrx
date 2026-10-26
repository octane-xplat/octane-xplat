// Port of upstream NavIcon/NavIconBasic.tsx (Astryx 0.6.4, MIT).
import { HStack, Icon, NavIcon } from '@octane-xplat/ui'

export function NavIconBasic() @{
	<HStack gap={4} vAlign="center">
		<NavIcon icon={<Icon name="xplat-search" />} />
		<NavIcon icon={<Icon name="xplat-calendar" />} />
	</HStack>
}
