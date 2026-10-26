// Port of upstream Timer/TimerFormats.tsx (Astryx 0.6.4, MIT).
import { useState } from 'octane'
import { Stack, Text, Timer } from '@octane-xplat/ui'

export function TimerFormats() @{
	const [startedAt] = useState(() => Date.now() - 3_753_000)
	<Stack direction="vertical" gap={3}>
		<Stack direction="horizontal" gap={3} vAlign="center">
			<Text type="supporting" color="secondary">Elapsed</Text>
			<Timer startTimeMs={startedAt} type="body" color="primary" />
		</Stack>
		<Stack direction="horizontal" gap={3} vAlign="center">
			<Text type="supporting" color="secondary">Clock</Text>
			<Timer format="clock" startTimeMs={startedAt} type="body" color="primary" />
		</Stack>
	</Stack>
}
