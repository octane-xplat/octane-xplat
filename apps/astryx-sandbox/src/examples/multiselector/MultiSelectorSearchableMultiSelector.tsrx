// Port of upstream MultiSelector/MultiSelectorSearchableMultiSelector.tsx (Astryx 0.6.4, MIT).
import { MultiSelector } from '@octane-xplat/ui'
import { useState } from 'octane'

export function MultiSelectorSearchableMultiSelector() @{
	const [value, setValue] = useState<string[]>([])
	<div style={{width: 320}}>
		<MultiSelector searchable label="Countries" options={[
			{ value: 'us', label: 'United States' },
			{ value: 'uk', label: 'United Kingdom' },
			{ value: 'ca', label: 'Canada' },
			{ value: 'de', label: 'Germany' },
			{ value: 'fr', label: 'France' },
			{ value: 'jp', label: 'Japan' },
			{ value: 'au', label: 'Australia' },
		]} value={value} onValueChange={setValue} placeholder="Select countries" />
	</div>
}
