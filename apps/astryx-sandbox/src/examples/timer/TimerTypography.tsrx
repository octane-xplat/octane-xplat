// Port of upstream Timer/TimerTypography.tsx (Astryx 0.6.4, MIT).
import { useState } from 'octane'
import { Stack, Text, Timer } from '@octane-xplat/ui'

export function TimerTypography() @{
	const [startedAt] = useState(() => Date.now() - 128_000)

	<Stack direction="vertical" gap={3}>
		<Text type="supporting" color="secondary">
			Default
		</Text>
		<Timer startTimeMs={startedAt} />
		<Text type="supporting" color="secondary">
			Emphasized
		</Text>
		<Timer startTimeMs={startedAt} type="body" size="xl" color="primary" weight="semibold" />
	</Stack>
}
