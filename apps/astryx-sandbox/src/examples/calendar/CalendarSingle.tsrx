// Port of upstream Calendar/CalendarSingle.tsx (Astryx 0.6.4, MIT).
import { Calendar } from '@octane-xplat/ui'
import { useState } from 'octane'
import type { ISODateString } from '@octane-xplat/ui'

export function CalendarSingle() @{
	const [value, setValue] = useState<ISODateString | null>('2025-03-15')
	const [focusDate, setFocusDate] = useState<ISODateString>('2025-03-15')
	<Calendar value={value} onChange={setValue} focusDate={focusDate} onFocusDateChange={setFocusDate} />
}
