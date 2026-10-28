// Port of upstream DateRangeInput/DateRangeInputShowcase.tsx (Astryx 0.6.4, MIT).
import { DateRangeInput } from '@octane-xplat/ui'
import { useState } from 'octane'
import type { DateRange } from '@octane-xplat/ui'

export function DateRangeInputShowcase() @{
	const [value, setValue] = useState<DateRange | null>(null)

	<div style={{ width: 400 }}>
		<DateRangeInput label="Vacation dates" value={value} onChange={setValue} />
	</div>
}
