// Port of upstream DateRangeInput/DateRangeInputWithPresets.tsx (Astryx 0.6.4, MIT).
import { DateRangeInput } from '@octane-xplat/ui'
import { useState } from 'octane'
import type { DateRange, ISODateString } from '@octane-xplat/ui'

const iso = (d: Date): ISODateString => d.toISOString().slice(0, 10) as ISODateString
const now = new Date()

export function DateRangeInputWithPresets() @{
	const [value, setValue] = useState<DateRange | null>(null)
	<div style={{width: 400}}>
		<DateRangeInput label="Report period" value={value} onChange={setValue} presets={[
			{ label: 'Last 7 days', getRange: () => ({ start: iso(new Date(now.getTime() - 7 * 86400000)), end: iso(now) }) },
			{ label: 'Last month', getRange: () => ({ start: iso(new Date(now.getFullYear(), now.getMonth() - 1, 1)), end: iso(new Date(now.getFullYear(), now.getMonth(), 0)) }) },
		]} />
	</div>
}
