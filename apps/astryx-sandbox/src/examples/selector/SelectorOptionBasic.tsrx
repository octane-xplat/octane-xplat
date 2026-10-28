// Port of upstream SelectorOption/SelectorOptionBasic.tsx (Astryx 0.6.4, MIT).
import { Selector, SelectorOption } from '@octane-xplat/ui'
import { useState } from 'octane'

export function SelectorOptionBasic() @{
	const [value, setValue] = useState<string | null>(null)

	<div style={{ width: 300 }}>
		<Selector
			label="Status"
			options={[
				{ value: 'draft', label: 'Draft', description: 'Not yet published' },
				{ value: 'review', label: 'In review', description: 'Waiting for approval' },
				{ value: 'published', label: 'Published', description: 'Live and visible' },
			]}
			value={value}
			onValueChange={setValue}
			placeholder="Choose status"
			renderOption={(option) => (
				<SelectorOption label={option.label} description={option.description} />
			)}
		/>
	</div>
}
