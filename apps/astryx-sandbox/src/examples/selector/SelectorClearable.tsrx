// Port of upstream Selector/SelectorClearable.tsx (Astryx 0.6.4, MIT).
import { Selector } from '@octane-xplat/ui'
import { useState } from 'octane'

export function SelectorClearable() @{
	const [value, setValue] = useState<string | null>('engineering')
	<div style={{width: 300}}>
		<Selector label="Team" options={[
			{ value: 'engineering', label: 'Engineering' },
			{ value: 'design', label: 'Design' },
			{ value: 'product', label: 'Product' },
			{ value: 'sales', label: 'Sales' },
		]} value={value} onValueChange={setValue} placeholder="Select team" hasClear />
	</div>
}
