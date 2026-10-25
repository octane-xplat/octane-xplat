// Port of upstream TimeInput/TimeInputShowcase.tsx (Astryx 0.6.4, MIT).
import { TimeInput } from '@octane-xplat/ui'
import { useState } from 'octane'
import type { ISODateString, ISOTimeString, ISODateTimeString, DateRange } from '@octane-xplat/ui'

export function TimeInputShowcase() @{
	const [value, setValue] = useState<ISOTimeString | null>(null)
	<div style={{width: 400}}>
		<TimeInput label="Start time" value={value} onChange={setValue} />
	</div>
}
