// Port of upstream Typeahead/TypeaheadWithHelperText.tsx (Astryx 0.6.4, MIT).
import { Typeahead, TypeaheadItem, createStaticSource } from '@octane-xplat/ui'
import { useState } from 'octane'

const CITIES = [
	'San Francisco',
	'New York',
	'London',
	'Tokyo',
	'Berlin',
	'Paris',
	'Sydney',
	'Toronto',
	'Amsterdam',
	'Singapore',
]

const source = createStaticSource(CITIES.map((c) => ({ id: c, label: c })))

export function TypeaheadWithHelperText() @{
	const [value, setValue] = useState<{ id: string; label: string } | null>(null)

	<div style={{ width: 320 }}>
		<Typeahead
			label="City"
			description="Select the city where your team is based"
			searchSource={source}
			value={value}
			onChange={setValue}
			placeholder="Start typing…"
			renderItem={(item) => <TypeaheadItem item={item} />}
		/>
	</div>
}
