// Port of upstream TimeInput/TimeInputFormats.tsx (Astryx 0.6.4, MIT).
import { TimeInput, Stack } from '@octane-xplat/ui'
import { useState } from 'octane'
import type { ISOTimeString } from '@octane-xplat/ui'

export function TimeInputFormats() @{
	const [a, setA] = useState<ISOTimeString | null>(null)
	const [b, setB] = useState<ISOTimeString | null>(null)

	<Stack direction="vertical" gap={4} style={{ width: 400 }}>
		<TimeInput label="12-hour format" hourFormat="12h" value={a} onChange={setA} />
		<TimeInput label="24-hour format" hourFormat="24h" value={b} onChange={setB} />
	</Stack>
}
