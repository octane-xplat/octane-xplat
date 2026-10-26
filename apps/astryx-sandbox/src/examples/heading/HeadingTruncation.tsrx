// Port of upstream Heading/HeadingTruncation.tsx (Astryx 0.6.4, MIT).
import { Heading, VStack } from '@octane-xplat/ui'

export function HeadingTruncation() @{
	<VStack gap={3} width={300}>
		<Heading level={3} maxLines={1}>A very long heading that truncates to a single line with an ellipsis</Heading>
		<Heading level={3} maxLines={2}>A very long heading that truncates after two lines so the rest of the text is hidden from the reader</Heading>
	</VStack>
}
