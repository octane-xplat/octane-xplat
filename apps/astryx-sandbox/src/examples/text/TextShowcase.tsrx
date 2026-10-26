// Port of upstream Text/TextShowcase.tsx (Astryx 0.6.4, MIT).
// Upstream Text type prop → the ported type/size/color props on Xplat Text.
import { Stack, Text } from '@octane-xplat/ui'

export function TextShowcase() @{
	return (
		<Stack direction="vertical" gap={2}>
			<Text type="body">Body: The bulk of content</Text>
			<Text type="large">Large: Emphasized content</Text>
			<Text type="label">Label: Form and chart labels</Text>
			<Text type="supporting">Supporting: Helper text</Text>
			<Text type="code">Code: const x = 42;</Text>
		</Stack>
	)
}
