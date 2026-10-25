// Port of upstream SelectorOption/SelectorOptionShowcase.tsx (Astryx 0.6.4, MIT).
import { Selector, SelectorOption, Icon } from '@octane-xplat/ui'
import { useState } from 'octane'

export function SelectorOptionShowcase() @{
	const [value, setValue] = useState<string | null>(null)
	<div style={{width: 300}}>
		<Selector label="Status" options={[
			{ value: 'draft', label: 'Draft', description: 'Not yet published' },
			{ value: 'review', label: 'In review', description: 'Waiting for approval' },
			{ value: 'published', label: 'Published', description: 'Live and visible' },
		]} value={value} onValueChange={setValue} placeholder="Choose status"
			renderOption={(option) => <SelectorOption icon={<Icon name="sandbox-info" size={16} />} label={option.label} description={option.description} />} />
	</div>
}
