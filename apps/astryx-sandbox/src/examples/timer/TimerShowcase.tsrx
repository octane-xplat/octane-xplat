// Port of upstream Timer/TimerShowcase.tsx (Astryx 0.6.4, MIT).
import { useState } from 'octane'
import { Stack, Text, Timer } from '@octane-xplat/ui'

export function TimerShowcase() @{
	const [startedAt] = useState(() => Date.now() - 3_753_000)

	<Stack direction="vertical" gap={4}>
		<Text type="large" color="primary" weight="semibold">
			Processing
		</Text>
		<Stack direction="horizontal" gap={6} vAlign="center">
			<Stack direction="vertical" gap={1}>
				<Text type="supporting" color="secondary">
					Elapsed
				</Text>
				<Timer startTimeMs={startedAt} type="body" size="xl" color="primary" weight="semibold" />
			</Stack>
			<Stack direction="vertical" gap={1}>
				<Text type="supporting" color="secondary">
					Clock
				</Text>
				<Timer
					format="clock"
					startTimeMs={startedAt}
					type="body"
					size="xl"
					color="primary"
					weight="semibold"
				/>
			</Stack>
		</Stack>
	</Stack>
}
