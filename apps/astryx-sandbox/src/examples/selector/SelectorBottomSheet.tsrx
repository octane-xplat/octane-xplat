// Port of upstream Selector/SelectorBottomSheet.tsx (Astryx 0.6.4, MIT).
import { Selector } from '@octane-xplat/ui'
import { useState } from 'octane'

export function SelectorBottomSheet() @{
	const [value, setValue] = useState<string | null>(null)

	<div style={{ width: 300 }}>
		<Selector
			presentation="bottom-sheet"
			label="Country"
			options={[
				{ value: 'us', label: 'United States' },
				{ value: 'uk', label: 'United Kingdom' },
				{ value: 'de', label: 'Germany' },
				{ value: 'fr', label: 'France' },
				{ value: 'jp', label: 'Japan' },
			]}
			value={value}
			onValueChange={setValue}
			placeholder="Select country"
		/>
	</div>
}
