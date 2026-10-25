// Port of upstream DateTimeInput/DateTimeInputShowcase.tsx (Astryx 0.6.4, MIT).
import { DateTimeInput } from '@octane-xplat/ui'
import { useState } from 'octane'
import type { ISODateString, ISOTimeString, ISODateTimeString, DateRange } from '@octane-xplat/ui'

export function DateTimeInputShowcase() @{
	const [value, setValue] = useState<ISODateTimeString | null>(null)
	<div style={{width: 400}}>
		<DateTimeInput label="Meeting time" value={value} onChange={setValue} />
	</div>
}
