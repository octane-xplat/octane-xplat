// Port of upstream StackItem/StackItemShowcase.tsx (Astryx 0.6.4, MIT).
import { Card, HStack, StackItem, Text } from '@octane-xplat/ui'

export function StackItemShowcase() @{
	<HStack gap={3} vAlign="center" width="100%" style={{ maxWidth: 500 }}>
		<StackItem size="static">
			<Card padding={3}>
				<Text type="supporting" color="secondary">
					Static Width
				</Text>
			</Card>
		</StackItem>
		<StackItem size="fill">
			<Card padding={3}>
				<Text type="supporting" color="secondary">
					Fills remaining space
				</Text>
			</Card>
		</StackItem>
		<StackItem size="static">
			<Card padding={3}>
				<Text type="supporting" color="secondary">
					Static Width
				</Text>
			</Card>
		</StackItem>
	</HStack>
}
