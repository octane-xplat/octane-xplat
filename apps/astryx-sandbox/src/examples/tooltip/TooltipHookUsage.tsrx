// Port of upstream Tooltip/TooltipHookUsage.tsx (Astryx 0.6.4, MIT).
import { Button, Center, useTooltip } from '@octane-xplat/ui'

export function TooltipHookUsage() @{
	const tooltip = useTooltip({ placement: 'above', delay: 100 })
	return (
		<Center>
			<Button
				label="Using hook directly"
				ref={tooltip.ref}
				web={{ 'aria-describedby': tooltip.describedBy } as any}
			/>
			{tooltip.renderTooltip('Tooltip via hook')}
		</Center>
	)
}
