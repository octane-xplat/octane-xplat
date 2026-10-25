// Port of upstream NumberInput/NumberInputClearableNumberInput.tsx (Astryx 0.6.4, MIT).
import { NumberInput } from '@octane-xplat/ui'
import { useState } from 'octane'

export function NumberInputClearableNumberInput() @{
	const [value, setValue] = useState<number | null>(75)
	<div style={{width: 300}}>
		<NumberInput label="Progress" units="%" min={0} max={100} value={value} onValueChange={setValue} hasClear />
	</div>
}
