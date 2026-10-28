// Port of upstream TimeInput/TimeInputIncrement.tsx (Astryx 0.6.4, MIT).
import { TimeInput } from '@octane-xplat/ui'
import { useState } from 'octane'
import type { ISODateString, ISOTimeString, ISODateTimeString, DateRange } from '@octane-xplat/ui'

export function TimeInputIncrement() @{
	const [value, setValue] = useState<ISOTimeString | null>(null)

	<div style={{ width: 400 }}>
		<TimeInput
			label="Reminder"
			increment={15}
			description="15-minute intervals"
			value={value}
			onChange={setValue}
		/>
	</div>
}
