// Port of upstream Calendar/CalendarTwoMonths.tsx (Astryx 0.6.4, MIT).
import { Calendar } from '@octane-xplat/ui'
import { useState } from 'octane'
import type { DateRange } from '@octane-xplat/ui'

export function CalendarTwoMonths() @{
	const [value, setValue] = useState<DateRange | null>(null)

	<Calendar mode="range" value={value} onChange={setValue} numberOfMonths={2} />
}
