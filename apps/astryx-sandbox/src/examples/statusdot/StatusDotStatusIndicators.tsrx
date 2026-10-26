// Port of upstream StatusDot/StatusDotStatusIndicators.tsx (Astryx 0.6.4, MIT).
import { HStack, StatusDot, Text, VStack } from '@octane-xplat/ui'

const statuses = [
	{ variant: 'success', label: 'Online' },
	{ variant: 'warning', label: 'Away' },
	{ variant: 'error', label: 'Offline' },
	{ variant: 'neutral', label: 'Unknown' },
] as const

export function StatusDotStatusIndicators() @{
	<VStack gap={2}>
		{statuses.map(({ variant, label }) => (
			<HStack key={variant} gap={2} vAlign="center">
				<StatusDot variant={variant} label={label} />
				<Text type="body">{label}</Text>
			</HStack>
		))}
	</VStack>
}
