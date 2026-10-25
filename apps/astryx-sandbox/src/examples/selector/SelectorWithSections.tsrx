// Port of upstream Selector/SelectorWithSections.tsx (Astryx 0.6.4, MIT).
import { Selector } from '@octane-xplat/ui'
import { useState } from 'octane'

export function SelectorWithSections() @{
	const [value, setValue] = useState<string | null>(null)
	<div style={{width: 300}}>
		<Selector label="Assignee" options={[
			{ value: 'sarah', label: 'Sarah Chen', group: 'Engineering' },
			{ value: 'mike', label: 'Mike Johnson', group: 'Engineering' },
			{ value: 'emma', label: 'Emma Davis', group: 'Design' },
			{ value: 'alex', label: 'Alex Kim', group: 'Design' },
			{ value: 'jordan', label: 'Jordan Lee', group: 'Product' },
		]} value={value} onValueChange={setValue} placeholder="Select assignee" />
	</div>
}
