// Port of upstream Tooltip/TooltipInlineTextTooltips.tsx (Astryx 0.6.4, MIT).
import { Text, Tooltip } from '@octane-xplat/ui'

export function TooltipInlineTextTooltips() @{
	return (
		<Text type="body">
			Learn more about our{' '}
			<Tooltip
				trigger={<Text color="accent">privacy policy</Text>}
				content="Your data is encrypted and never shared"
				placement="top"
			/>{' '}
			and{' '}
			<Tooltip
				trigger={<Text color="accent">terms of service</Text>}
				content="Standard 30-day agreement"
				placement="top"
			/>
			.
		</Text>
	)
}
