// Port of upstream NumberInput/NumberInputWithUnits.tsx (Astryx 0.6.4, MIT).
import { NumberInput } from '@octane-xplat/ui'
import { useState } from 'octane'

export function NumberInputWithUnits() @{
	const [value, setValue] = useState<number | null>(50)
	<div style={{width: 300}}>
		<NumberInput label="Discount" placeholder="Enter discount" min={0} max={100} units="%" value={value} onValueChange={setValue} />
	</div>
}
