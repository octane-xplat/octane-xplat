// Port of upstream Selector/SelectorOptionDescriptions.tsx (Astryx 0.6.4, MIT).
import { Selector } from '@octane-xplat/ui'
import { useState } from 'octane'

export function SelectorOptionDescriptions() @{
	const [value, setValue] = useState<string | null>(null)

	<div style={{ width: 300 }}>
		<Selector
			label="Deployment"
			options={[
				{
					value: 'production',
					label: 'Production',
					description: 'Live environment with real data',
				},
				{ value: 'staging', label: 'Staging', description: 'Pre-production testing environment' },
				{
					value: 'development',
					label: 'Development',
					description: 'Local development environment',
				},
			]}
			value={value}
			onValueChange={setValue}
			placeholder="Choose environment"
		/>
	</div>
}
