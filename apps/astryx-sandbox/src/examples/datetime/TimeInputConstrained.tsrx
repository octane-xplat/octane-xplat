// Port of upstream TimeInput/TimeInputConstrained.tsx (Astryx 0.6.4, MIT).
import { TimeInput } from '@octane-xplat/ui'
import { useState } from 'octane'
import type { ISODateString, ISOTimeString, ISODateTimeString, DateRange } from '@octane-xplat/ui'

export function TimeInputConstrained() @{
	const [value, setValue] = useState<ISOTimeString | null>(null)
	<div style={{width: 400}}>
		<TimeInput label="Meeting start" min="09:00" max="17:00" description="Business hours only" value={value} onChange={setValue} />
	</div>
}
