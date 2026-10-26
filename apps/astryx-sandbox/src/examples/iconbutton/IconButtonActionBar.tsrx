// Port of upstream IconButton/IconButtonActionBar.tsx (Astryx 0.6.4, MIT).
import { HStack, Icon, IconButton } from '@octane-xplat/ui'

export function IconButtonActionBar() @{
	<HStack gap={1}>
		<IconButton label="Search" icon={<Icon name="xplat-search" color="inherit" />} variant="ghost" />
		<IconButton label="Copy" icon={<Icon name="xplat-copy" color="inherit" />} variant="ghost" />
		<IconButton label="Info" icon={<Icon name="xplat-info" color="inherit" />} variant="ghost" />
		<IconButton label="Menu" icon={<Icon name="sandbox-menu" color="inherit" />} variant="ghost" />
		<IconButton label="Close" icon={<Icon name="xplat-close" color="inherit" />} variant="ghost" />
	</HStack>
}
