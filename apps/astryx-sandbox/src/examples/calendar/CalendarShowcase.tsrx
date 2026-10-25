// Port of upstream Calendar/CalendarShowcase.tsx (Astryx 0.6.4, MIT).
import { Calendar } from '@octane-xplat/ui'
import { useState } from 'octane'
import type { ISODateString, ISOTimeString, ISODateTimeString, DateRange } from '@octane-xplat/ui'

export function CalendarShowcase() @{
	const [value, setValue] = useState<ISODateString | null>(null)
	<Calendar value={value} onChange={setValue} />
}
