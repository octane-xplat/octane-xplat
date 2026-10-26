// Port of upstream HStack/HStackBasic.tsx (Astryx 0.6.4, MIT).
import { Badge, HStack } from '@octane-xplat/ui'

export function HStackBasic() @{
	<HStack gap={2} vAlign="center">
		<Badge label="React" />
		<Badge label="TypeScript" />
		<Badge label="Node.js" />
	</HStack>
}
