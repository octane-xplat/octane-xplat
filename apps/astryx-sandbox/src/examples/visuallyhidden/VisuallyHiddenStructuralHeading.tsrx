// Port of upstream VisuallyHidden/VisuallyHiddenStructuralHeading.tsx
// (Astryx 0.6.4, MIT).
import { Badge, Card, HStack, Text, VisuallyHidden, VStack } from '@octane-xplat/ui'

const items = [
	{ name: 'astryx-core', status: 'Passing', variant: 'success' },
	{ name: 'astryx-charts', status: 'Failing', variant: 'error' },
	{ name: 'astryx-cli', status: 'Passing', variant: 'success' },
] as const

export function VisuallyHiddenStructuralHeading() {
	return (
		<VStack gap={3} hAlign="start">
			<Text type="supporting" color="secondary">
				The layout makes this group obvious to sighted users. A hidden heading
				gives screen-reader users the same landmark to jump to.
			</Text>
			{/* No visible heading is needed here, but AT users navigate by heading. */}
			<VisuallyHidden as="h2">Build status</VisuallyHidden>
			<VStack gap={2}>
				{items.map(({ name, status, variant }) => (
					<Card key={name} variant="muted" padding={3}>
						<HStack gap={3} vAlign="center">
							<Text type="body">{name}</Text>
							<Badge label={status} variant={variant} />
						</HStack>
					</Card>
				))}
			</VStack>
		</VStack>
	)
}
