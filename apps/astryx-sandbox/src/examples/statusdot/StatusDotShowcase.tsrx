// Port of upstream StatusDot/StatusDotShowcase.tsx (Astryx 0.6.4, MIT).
import { HStack, StatusDot } from '@octane-xplat/ui'

export function StatusDotShowcase() @{
	<HStack gap={2} vAlign="center">
		<StatusDot variant="success" label="Positive" />
		<StatusDot variant="warning" label="Warning" />
		<StatusDot variant="error" label="Negative" />
		<StatusDot variant="accent" label="Info" />
		<StatusDot variant="neutral" label="Neutral" />
	</HStack>
}
