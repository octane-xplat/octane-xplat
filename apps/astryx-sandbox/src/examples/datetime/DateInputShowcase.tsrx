// Port of upstream DateInput/DateInputShowcase.tsx (Astryx 0.6.4, MIT).
import { DateInput } from '@octane-xplat/ui'
import { useState } from 'octane'
import type { ISODateString, ISOTimeString, ISODateTimeString, DateRange } from '@octane-xplat/ui'

export function DateInputShowcase() @{
	const [value, setValue] = useState<ISODateString | null>(null)

	<div style={{ width: 400 }}>
		<DateInput label="Birthday" value={value} onChange={setValue} />
	</div>
}
