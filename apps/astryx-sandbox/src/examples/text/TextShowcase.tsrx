// Port of upstream Text/TextShowcase.tsx (Astryx 0.6.4, MIT).
// Upstream Text type prop → token classes; code type → --font-mono class.
import { Stack, Text } from '@octane-xplat/ui'

export function TextShowcase() @{
	return (
		<Stack direction="vertical" gap={2}>
			<Text className="sb-type-body">Body: The bulk of content</Text>
			<Text className="sb-type-large">Large: Emphasized content</Text>
			<Text className="sb-type-label">Label: Form and chart labels</Text>
			<Text className="sb-type-supporting">Supporting: Helper text</Text>
			<Text className="sb-type-code">Code: const x = 42;</Text>
		</Stack>
	)
}
