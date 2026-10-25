// Port of upstream DateInput/DateInputDateRange.tsx (Astryx 0.6.4, MIT).
import { DateInput } from '@octane-xplat/ui'
import { useState } from 'octane'
import type { ISODateString } from '@octane-xplat/ui'

const now = new Date()
const first = new Date(now.getFullYear(), now.getMonth(), 1)
const last = new Date(now.getFullYear(), now.getMonth() + 1, 0)
const iso = (d: Date): ISODateString => d.toISOString().slice(0, 10) as ISODateString

export function DateInputDateRange() @{
	const [value, setValue] = useState<ISODateString | null>(null)
	<div style={{width: 400}}>
		<DateInput label="Project deadline" description="Choose a date this month" min={iso(first)} max={iso(last)} presentation="adaptive-bottom-sheet" value={value} onChange={setValue} />
	</div>
}
