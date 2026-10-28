// Port of upstream MultiSelector/MultiSelectorShowcase.tsx (Astryx 0.6.4, MIT).
import { MultiSelector } from '@octane-xplat/ui'
import { useState } from 'octane'

export function MultiSelectorShowcase() @{
	const [value, setValue] = useState<string[]>(['react'])

	<div style={{ width: 320 }}>
		<MultiSelector
			label="Technologies"
			options={[
				{ value: 'react', label: 'React' },
				{ value: 'typescript', label: 'TypeScript' },
				{ value: 'css', label: 'CSS' },
				{ value: 'graphql', label: 'GraphQL' },
				{ value: 'nodejs', label: 'Node.js' },
			]}
			value={value}
			onValueChange={setValue}
			placeholder="Select technologies"
		/>
	</div>
}
