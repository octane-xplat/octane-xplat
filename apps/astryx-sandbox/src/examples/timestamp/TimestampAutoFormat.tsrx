// Port of upstream Timestamp/TimestampAutoFormat.tsx (Astryx 0.6.4, MIT).
import { Stack, Text, Timestamp } from '@octane-xplat/ui'

export function TimestampAutoFormat() @{
	const now = Date.now() / 1000
	<Stack direction="vertical" gap={4}>
		<Stack direction="vertical" gap={1}>
			<Text type="supporting" color="secondary">Recent — renders as relative</Text>
			<Stack direction="horizontal" gap={4} vAlign="center">
				<Timestamp value={now - 300} valueUnit="unix-seconds" format="auto" color="primary" />
				<Timestamp value={now - 7200} valueUnit="unix-seconds" format="auto" color="primary" />
				<Timestamp value={now - 86400} valueUnit="unix-seconds" format="auto" color="primary" />
			</Stack>
		</Stack>
		<Stack direction="vertical" gap={1}>
			<Text type="supporting" color="secondary">Older than 7 days — renders as date_time</Text>
			<Stack direction="horizontal" gap={4} vAlign="center">
				<Timestamp value="2025-01-15T09:30:00Z" format="auto" color="primary" />
				<Timestamp value="2024-06-01T14:00:00Z" format="auto" color="primary" />
			</Stack>
		</Stack>
	</Stack>
}
