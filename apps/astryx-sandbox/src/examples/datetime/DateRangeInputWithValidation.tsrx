// Port of upstream DateRangeInput/DateRangeInputWithValidation.tsx (Astryx 0.6.4, MIT).
import { DateRangeInput } from '@octane-xplat/ui'
import { useState } from 'octane'
import type { DateRange } from '@octane-xplat/ui'

export function DateRangeInputWithValidation() @{
	const [value, setValue] = useState<DateRange | null>(null)
	const invalid = value != null && value.end < value.start
	<div style={{width: 400}}>
		<DateRangeInput label="Contract period" isRequired status={invalid ? { type: 'error', message: 'End date must be after start date' } : undefined} value={value} onChange={setValue} />
	</div>
}
