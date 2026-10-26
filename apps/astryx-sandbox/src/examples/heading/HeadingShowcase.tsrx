// Port of upstream Heading/HeadingShowcase.tsx (Astryx 0.6.4, MIT).
import { Heading, VStack } from '@octane-xplat/ui'

export function HeadingShowcase() @{
	<VStack gap={3}>
		<Heading level={1}>Heading level 1</Heading>
		<Heading level={2}>Heading level 2</Heading>
		<Heading level={3}>Heading level 3</Heading>
		<Heading level={4}>Heading level 4</Heading>
		<Heading level={5}>Heading level 5</Heading>
		<Heading level={6}>Heading level 6</Heading>
	</VStack>
}
