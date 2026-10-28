// Port of upstream NumberInput/NumberInputShowcase.tsx (Astryx 0.6.4, MIT).
import { NumberInput } from '@octane-xplat/ui'
import { useState } from 'octane'

export function NumberInputShowcase() @{
	const [value, setValue] = useState<number | null>(0)

	<div style={{ width: 300 }}>
		<NumberInput
			label="Quantity"
			placeholder="Enter quantity"
			value={value}
			onValueChange={setValue}
			formatValue={(n) => `${n} items`}
			hasNumberSteppers
		/>
	</div>
}
