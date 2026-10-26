// Port of upstream VStack/VStackShowcase.tsx (Astryx 0.6.4, MIT).
import { Badge, HStack, Text, VStack } from '@octane-xplat/ui'

export function VStackShowcase() @{
	<HStack gap={10} hAlign="center">
		{([2, 4, 6] as const).map((g) => (
			<VStack gap={2}>
				<Text type="supporting" color="secondary">gap={g}</Text>
				<VStack gap={g}>
					<Badge label="Step 1" />
					<Badge label="Step 2" />
					<Badge label="Step 3" />
				</VStack>
			</VStack>
		))}
	</HStack>
}
