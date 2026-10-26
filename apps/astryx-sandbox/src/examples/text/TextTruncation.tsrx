// Port of upstream Text/TextTruncation.tsx (Astryx 0.6.4, MIT).
// maxLines prop is now native to Xplat Text.
import { Stack, Text, View } from '@octane-xplat/ui'

const LONG_TEXT =
	'The design system provides a consistent set of typography tokens, spacing scales, and color palettes that ensure every surface in the product feels cohesive regardless of which team built it.'

const LINES = [
	{ maxLines: 1, label: '1 line' },
	{ maxLines: 2, label: '2 lines' },
	{ maxLines: 3, label: '3 lines' },
]

export function TextTruncation() @{
	return (
		<Stack direction="vertical" gap={4} style={{ maxWidth: 300 }}>
			{LINES.map(({ maxLines, label }) => (
				<View key={maxLines}>
					<Text className="sb-type-supporting sb-color-secondary sb-block">{label}</Text>
					<View className="sb-example-box">
						<Text className="sb-type-body" maxLines={maxLines}>
							{LONG_TEXT}
						</Text>
					</View>
				</View>
			))}
		</Stack>
	)
}
