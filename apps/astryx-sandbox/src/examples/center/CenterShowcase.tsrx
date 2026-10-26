// Port of upstream Center/CenterShowcase.tsx (Astryx 0.6.4, MIT).
import { Center, Heading, Stack, Text } from '@octane-xplat/ui'

export function CenterShowcase() @{
	<Center axis="both" width="100%" height={240}>
		<Stack direction="vertical" gap={2} hAlign="center">
			<Heading level={4}>Centered content</Heading>
			<Text type="body" color="secondary">Horizontally and vertically aligned.</Text>
		</Stack>
	</Center>
}
