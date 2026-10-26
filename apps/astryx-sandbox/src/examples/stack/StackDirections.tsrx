// Port of upstream Stack/StackDirections.tsx (Astryx 0.6.4, MIT).
import { HStack, Token, VStack } from '@octane-xplat/ui'

export function StackDirections() @{
	<HStack gap={10} hAlign="center">
		<HStack gap={2} vAlign="center">
			<Token label="Horizontal" />
			<Token label="Horizontal" />
			<Token label="Horizontal" />
		</HStack>
		<VStack gap={2}>
			<Token label="Vertical" />
			<Token label="Vertical" />
			<Token label="Vertical" />
		</VStack>
	</HStack>
}
