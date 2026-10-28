// Port of upstream DateInput/DateInputWithValidation.tsx (Astryx 0.6.4, MIT).
import { DateInput } from '@octane-xplat/ui'
import { useState } from 'octane'
import type { ISODateString, ISOTimeString, ISODateTimeString, DateRange } from '@octane-xplat/ui'

export function DateInputWithValidation() @{
	const [value, setValue] = useState<ISODateString | null>(null)
	const status =
		value != null && value < '2025-01-01'
			? { type: 'error' as const, message: 'Date must be in 2025 or later' }
			: undefined

	<div style={{ width: 400 }}>
		<DateInput
			label="Effective date"
			isRequired
			status={status}
			value={value}
			onChange={setValue}
		/>
	</div>
}
