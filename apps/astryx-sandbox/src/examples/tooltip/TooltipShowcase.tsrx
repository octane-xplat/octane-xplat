// Port of upstream Tooltip/TooltipShowcase.tsx (Astryx 0.6.4, MIT).
// Upstream trigger-children → trigger prop; placement 'above' → 'top'.
import { Button, Tooltip } from '@octane-xplat/ui'

export function TooltipShowcase() @{
	return <Tooltip trigger={<Button label="Hover me" />} content="This is a helpful tooltip" placement="top" />
}
