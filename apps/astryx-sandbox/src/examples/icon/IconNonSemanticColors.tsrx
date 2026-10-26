// Port of upstream Icon/IconNonSemanticColors.tsx (Astryx 0.6.4, MIT).
import { HStack, Icon, Text, VStack } from '@octane-xplat/ui'

const colors = ['blue', 'red', 'green', 'gray', 'cyan', 'teal', 'yellow', 'orange', 'pink', 'purple'] as const

export function IconNonSemanticColors() @{
	<HStack gap={4} wrap="wrap">
		{colors.map((color) => (
			<VStack key={color} gap={1} hAlign="center">
				<Icon name="xplat-search" color={`var(--color-text-${color}, ${color})`} />
				<Text type="supporting">{color}</Text>
			</VStack>
		))}
	</HStack>
}
