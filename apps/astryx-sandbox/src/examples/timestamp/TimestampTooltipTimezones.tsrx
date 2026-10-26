// Port of upstream Timestamp/TimestampTooltipTimezones.tsx (Astryx 0.6.4, MIT).
import { Stack, Text, Timestamp } from '@octane-xplat/ui'

const DATE = '2026-02-19T17:00:00Z'

export function TimestampTooltipTimezones() @{
	<Stack direction="vertical" gap={4}>
		<Stack direction="vertical" gap={1}>
			<Text type="supporting" color="secondary">Local + UTC — hover to compare</Text>
			<Timestamp
				value={DATE}
				format="relative"
				color="primary"
				tooltipEntries={[
					{ format: 'date_time', label: 'Local' },
					{ timezoneID: 'UTC', format: 'date_time', label: 'UTC' },
				]}
			/>
		</Stack>
		<Stack direction="vertical" gap={1}>
			<Text type="supporting" color="secondary">Incident origin zone alongside the reader's</Text>
			<Timestamp
				value={DATE}
				format="date_time"
				color="primary"
				tooltipEntries={[
					{ format: 'date_time', label: 'Local' },
					{ timezoneID: 'America/Los_Angeles', format: 'date_time', label: 'Origin' },
				]}
			/>
		</Stack>
		<Stack direction="vertical" gap={1}>
			<Text type="supporting" color="secondary">Friendly line plus a machine-precise line</Text>
			<Timestamp
				value={DATE}
				format="date_time"
				color="primary"
				tooltipEntries={[
					{ format: 'full' },
					{ format: 'system_date_time', label: 'ISO' },
				]}
			/>
		</Stack>
	</Stack>
}
