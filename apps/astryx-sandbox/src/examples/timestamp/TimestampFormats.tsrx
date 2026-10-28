// Port of upstream Timestamp/TimestampFormats.tsx (Astryx 0.6.4, MIT).
import { Stack, Text, Timestamp } from '@octane-xplat/ui'

const DATE = '2026-02-19T17:00:00Z'

export function TimestampFormats() @{
	<Stack direction="vertical" gap={2}>
		{(['date', 'date_long', 'date_weekday', 'date_time', 'time'] as const).map((format) => (
			<Stack direction="horizontal" gap={4} vAlign="center">
				<Text type="supporting" color="secondary" style={{ width: 110 }}>
					{format}
				</Text>
				<Timestamp value={DATE} format={format} color="primary" />
			</Stack>
		))}
	</Stack>
}
