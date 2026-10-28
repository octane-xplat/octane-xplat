// Port of upstream HoverCard/HoverCardShowcase.tsx (Astryx 0.6.4, MIT).
import { HoverCard, Text, VStack } from '@octane-xplat/ui'

export function HoverCardShowcase() @{
	<Text type="body">
		Hover over the{' '}
		<HoverCard
			content={
				<VStack gap={1} style={{ maxWidth: 200 }}>
					<Text type="label">Hover card</Text>
					<Text type="body" color="secondary">
						Preview content that appears on hover or focus without navigating.
					</Text>
				</VStack>
			}
		>
			highlighted term
		</HoverCard>{' '}
		to see a definition.
	</Text>
}
