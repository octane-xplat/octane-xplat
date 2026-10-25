// Port of upstream MultiSelector/MultiSelectorSectionedMultiSelector.tsx (Astryx 0.6.4, MIT).
import { MultiSelector } from '@octane-xplat/ui'
import { useState } from 'octane'

export function MultiSelectorSectionedMultiSelector() @{
	const [value, setValue] = useState<string[]>([])
	<div style={{width: 320}}>
		<MultiSelector label="Technologies" options={[
			{ value: 'react', label: 'React', group: 'Frontend' },
			{ value: 'vue', label: 'Vue', group: 'Frontend' },
			{ value: 'angular', label: 'Angular', group: 'Frontend' },
			{ value: 'nodejs', label: 'Node.js', group: 'Backend' },
			{ value: 'python', label: 'Python', group: 'Backend' },
			{ value: 'go', label: 'Go', group: 'Backend' },
		]} value={value} onValueChange={setValue} placeholder="Select technologies" />
	</div>
}
