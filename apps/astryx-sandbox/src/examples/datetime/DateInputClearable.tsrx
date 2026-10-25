// Port of upstream DateInput/DateInputClearable.tsx (Astryx 0.6.4, MIT).
import { DateInput } from '@octane-xplat/ui'
import { useState } from 'octane'
import type { ISODateString, ISOTimeString, ISODateTimeString, DateRange } from '@octane-xplat/ui'

export function DateInputClearable() @{
	const [value, setValue] = useState<ISODateString | null>(null)
	<div style={{width: 400}}>
		<DateInput label="Start date" description="Pick a start date for your project" placeholder="YYYY-MM-DD" value={value} onChange={setValue} hasClear />
	</div>
}
