// Port of upstream VisuallyHidden/VisuallyHiddenSupplementaryContext.tsx
// (Astryx 0.6.4, MIT). Heroicon paths map to the sandbox icon registry.
import { Card, HStack, Icon, Text, VisuallyHidden, VStack } from '@octane-xplat/ui'

const stats = [
	{ label: 'Revenue', value: '$48.2k', delta: '+12%', direction: 'up' },
	{ label: 'Churn', value: '2.1%', delta: '-4%', direction: 'down' },
] as const

export function VisuallyHiddenSupplementaryContext() {
	return (
		<HStack gap={4} wrap="wrap">
			{stats.map(({ label, value, delta, direction }) => (
				<Card key={label} variant="muted">
					<VStack gap={1}>
						<Text type="supporting" color="secondary">
							{label}
						</Text>
						<Text type="display-3">{value}</Text>
						<HStack gap={1} vAlign="center">
							<Icon
								name={direction === 'up' ? 'sandbox-arrow-up' : 'sandbox-arrow-down'}
								size={16}
								color={direction === 'up' ? 'accent' : 'secondary'}
							/>
							<Text type="body">
								{delta}
								{/* The arrow is decorative; spell out the trend for AT. */}
								<VisuallyHidden>
									{direction === 'up' ? ' increase' : ' decrease'} from last
									month
								</VisuallyHidden>
							</Text>
						</HStack>
					</VStack>
				</Card>
			))}
		</HStack>
	)
}
