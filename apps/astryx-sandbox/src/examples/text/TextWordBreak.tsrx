// Port of upstream Text/TextWordBreak.tsx (Astryx 0.6.4, MIT).
// wordBreak prop → inline style.
import { Stack, Text, View } from '@octane-xplat/ui'

export function TextWordBreak() @{
	return (
		<Stack direction="vertical" gap={4} style={{ maxWidth: 400 }}>
			<View>
				<Text type="label" className="sb-block">Break-word (default for multi-line)</Text>
				<View className="sb-example-box" style={{ width: 200 }}>
					<Text type="body" maxLines={2} style={{ wordBreak: 'break-word' }}>
						This is a verylongunbreakableword for a break-word example
					</Text>
				</View>
			</View>
			<View>
				<Text type="label" className="sb-block">Break-all (default for single-line)</Text>
				<View className="sb-example-box" style={{ width: 200 }}>
					<Text type="body" maxLines={2} style={{ wordBreak: 'break-all' }}>
						Breaks anywhere: abcdefghijklmnopqrstuvwxyz0123456789
					</Text>
				</View>
			</View>
		</Stack>
	)
}
