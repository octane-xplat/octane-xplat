// Port of upstream Typeahead/TypeaheadSearchField.tsx (Astryx 0.6.4, MIT).
import { Typeahead, TypeaheadItem, createStaticSource } from '@octane-xplat/ui'
import { useState } from 'octane'

const USERS = [
	{ id: '1', label: 'Sarah Chen', auxiliaryData: { role: 'Engineer' } },
	{ id: '2', label: 'Mike Johnson', auxiliaryData: { role: 'Designer' } },
	{ id: '3', label: 'Emma Davis', auxiliaryData: { role: 'Product Manager' } },
	{ id: '4', label: 'Alex Kim', auxiliaryData: { role: 'Engineer' } },
	{ id: '5', label: 'Jordan Lee', auxiliaryData: { role: 'Designer' } },
]
const source = createStaticSource(USERS)

export function TypeaheadSearchField() @{
	const [value, setValue] = useState<typeof USERS[number] | null>(null)
	<div style={{width: 320}}>
		<Typeahead label="Search team members" isLabelHidden searchSource={source} value={value} onChange={setValue} placeholder="Search team…" renderItem={(item) => <TypeaheadItem item={item} />} />
	</div>
}
