// Port of upstream Calendar/CalendarRangeWithValue.tsx (Astryx 0.6.4, MIT).
import { Calendar } from '@octane-xplat/ui'
import { useState } from 'octane'
import type { DateRange } from '@octane-xplat/ui'

export function CalendarRangeWithValue() @{
	const [value, setValue] = useState<DateRange | null>({ start: '2025-03-10', end: '2025-03-20' })

	<Calendar mode="range" value={value} onChange={setValue} />
}
