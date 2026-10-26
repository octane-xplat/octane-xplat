// Port of upstream StatusDot/StatusDotPulsing.tsx (Astryx 0.6.4, MIT).
import { HStack, StatusDot } from '@octane-xplat/ui'

export function StatusDotPulsing() @{
	<HStack gap={2} vAlign="center">
		<StatusDot variant="success" label="Live" isPulsing />
		<StatusDot variant="warning" label="Processing" isPulsing />
		<StatusDot variant="error" label="Error" isPulsing />
		<StatusDot variant="accent" label="Processing" isPulsing />
		<StatusDot variant="neutral" label="Error" isPulsing />
	</HStack>
}
