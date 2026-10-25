// Port of upstream Calendar/CalendarConstraints.tsx (Astryx 0.6.4, MIT).
import { Calendar } from '@octane-xplat/ui'
import { useState } from 'octane'
import type { ISODateString } from '@octane-xplat/ui'

const now = new Date()
const iso = (d: Date): ISODateString => d.toISOString().slice(0, 10) as ISODateString
const min = iso(now)
const max = iso(new Date(now.getTime() + 60 * 86400000))

export function CalendarConstraints() @{
	const [value, setValue] = useState<ISODateString | null>(null)
	<Calendar value={value} onChange={setValue} min={min} max={max} />
}
