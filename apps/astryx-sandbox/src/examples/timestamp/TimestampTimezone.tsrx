// Port of upstream Timestamp/TimestampTimezone.tsx (Astryx 0.6.4, MIT).
import { Stack, Text, Timestamp } from '@octane-xplat/ui'

const DATE = '2026-02-19T17:00:00Z'

export function TimestampTimezone() @{
	<Stack direction="vertical" gap={4}>
		<Stack direction="vertical" gap={1}>
			<Text type="supporting" color="secondary">User-facing with timezone</Text>
			<Stack direction="horizontal" gap={4} vAlign="center">
				<Timestamp value={DATE} format="date_time" isTimezoneShown color="primary" />
				<Timestamp value={DATE} format="time" isTimezoneShown color="primary" />
			</Stack>
		</Stack>
		<Stack direction="vertical" gap={1}>
			<Text type="supporting" color="secondary">System formats stay machine-readable — never suffixed with a zone</Text>
			<Stack direction="horizontal" gap={4} vAlign="center">
				<Timestamp value={DATE} format="system_date_time" type="code" color="primary" />
				<Timestamp value={DATE} format="system_time" type="code" color="primary" />
			</Stack>
		</Stack>
	</Stack>
}
