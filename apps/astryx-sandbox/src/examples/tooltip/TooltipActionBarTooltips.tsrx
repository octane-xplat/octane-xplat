// Port of upstream Tooltip/TooltipActionBarTooltips.tsx (Astryx 0.6.4, MIT).
import { Button, Center, HStack, Tooltip } from '@octane-xplat/ui'

export function TooltipActionBarTooltips() @{
	return (
		<Center>
			<HStack gap={4}>
				<Tooltip trigger={<Button label="Save" />} content="Save your changes" placement="top" />
				<Tooltip trigger={<Button label="Cancel" />} content="Discard changes" placement="top" />
				<Tooltip
					trigger={<Button label="Delete" variant="destructive" />}
					content="Delete permanently"
					placement="top"
				/>
			</HStack>
		</Center>
	)
}
