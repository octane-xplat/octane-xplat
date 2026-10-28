// Port of upstream NumberInput/NumberInputRangeNumberInput.tsx (Astryx 0.6.4, MIT).
import { NumberInput } from '@octane-xplat/ui'
import { useState } from 'octane'

export function NumberInputRangeNumberInput() @{
	const [value, setValue] = useState<number | null>(3)

	<div style={{ width: 300 }}>
		<NumberInput
			label="Team Size"
			placeholder="1–50"
			min={1}
			max={50}
			description="Number of people on the team"
			value={value}
			onValueChange={setValue}
		/>
	</div>
}
