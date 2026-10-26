// Port of upstream Icon/IconSizes.tsx (Astryx 0.6.4, MIT).
import { HStack, Icon, Text, VStack } from '@octane-xplat/ui'

export function IconSizes() @{
	<HStack gap={4}>
		{([12, 16, 20, 24] as const).map((size) => (
			<VStack key={size} gap={1} hAlign="center">
				<Icon name="xplat-search" size={size} />
				<Text type="supporting">{size}px</Text>
			</VStack>
		))}
	</HStack>
}
