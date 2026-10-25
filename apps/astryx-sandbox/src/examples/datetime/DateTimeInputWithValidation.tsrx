// Port of upstream DateTimeInput/DateTimeInputWithValidation.tsx (Astryx 0.6.4, MIT).
import { DateTimeInput } from '@octane-xplat/ui'
import { useState } from 'octane'
import type { ISODateString, ISOTimeString, ISODateTimeString, DateRange } from '@octane-xplat/ui'

export function DateTimeInputWithValidation() @{
	const [value, setValue] = useState<ISODateTimeString | null>(null)
	<div style={{width: 400}}>
		<DateTimeInput label="Launch time" isRequired description="Schedule the production deploy" value={value} onChange={setValue} />
	</div>
}
