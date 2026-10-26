// Port of upstream Timestamp/TimestampColors.tsx (Astryx 0.6.4, MIT).
import { Stack, Text, Timestamp } from '@octane-xplat/ui'

const DATE = '2026-02-19T17:00:00Z'

export function TimestampColors() @{
	<Stack direction="vertical" gap={4}>
		{(['primary', 'secondary', 'disabled', 'accent'] as const).map((color) => (
			<Stack direction="vertical" gap={1}>
				<Text type="supporting" color="secondary">{color[0].toUpperCase() + color.slice(1)}</Text>
				<Timestamp value={DATE} format="date_time" color={color} />
			</Stack>
		))}
	</Stack>
}
