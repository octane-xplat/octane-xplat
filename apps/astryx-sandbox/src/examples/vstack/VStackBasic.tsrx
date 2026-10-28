// Port of upstream VStack/VStackBasic.tsx (Astryx 0.6.4, MIT).
import { Heading, Text, VStack } from '@octane-xplat/ui'

export function VStackBasic() @{
	<VStack gap={3}>
		<Heading level={5}>Weekly Report</Heading>
		<Text type="body" color="secondary">
			VStack arranges its children in a vertical column.
		</Text>
		<Text type="body" color="secondary">
			The gap prop controls the spacing between each item.
		</Text>
	</VStack>
}
