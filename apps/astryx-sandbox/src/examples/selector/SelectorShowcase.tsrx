// Port of upstream Selector/SelectorShowcase.tsx (Astryx 0.6.4, MIT).
import { Selector } from '@octane-xplat/ui'
import { useState } from 'octane'

export function SelectorShowcase() @{
	const [value, setValue] = useState<string | null>(null)

	<div style={{ width: 300 }}>
		<Selector
			label="Framework"
			options={[
				{ value: 'react', label: 'React' },
				{ value: 'vue', label: 'Vue' },
				{ value: 'angular', label: 'Angular' },
				{ value: 'svelte', label: 'Svelte' },
			]}
			value={value}
			onValueChange={setValue}
			placeholder="Select a framework"
		/>
	</div>
}
