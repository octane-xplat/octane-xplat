// Port of upstream Timestamp/TimestampRelativeFormat.tsx (Astryx 0.6.4, MIT).
import { Stack, Text, Timestamp } from '@octane-xplat/ui'

export function TimestampRelativeFormat() @{
	const now = Date.now() / 1000
	<Stack direction="vertical" gap={3}>
		<Text type="supporting" color="secondary">Relative timestamps (hover for full date)</Text>
		<Stack direction="vertical" gap={2}>
			{[5, 120, 3600, 86400, 259200, 90 * 86400].map((d) => (
				<Timestamp key={d} value={now - d} valueUnit="unix-seconds" format="relative" color="primary" />
			))}
		</Stack>
	</Stack>
}
