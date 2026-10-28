// Port of upstream IconButton/IconButtonTooltipIconButton.tsx (Astryx 0.6.4, MIT).
import { HStack, Icon, IconButton } from '@octane-xplat/ui'

export function IconButtonTooltipIconButton() @{
	<HStack gap={2}>
		<IconButton
			label="Search"
			icon={<Icon name="xplat-search" color="inherit" />}
			variant="ghost"
			tooltip="Search items"
		/>
		<IconButton
			label="Copy link"
			icon={<Icon name="xplat-copy" color="inherit" />}
			variant="ghost"
			tooltip="Copy to clipboard"
		/>
		<IconButton
			label="More options"
			icon={<Icon name="xplat-more-horizontal" color="inherit" />}
			variant="ghost"
			tooltip="More options"
		/>
	</HStack>
}
