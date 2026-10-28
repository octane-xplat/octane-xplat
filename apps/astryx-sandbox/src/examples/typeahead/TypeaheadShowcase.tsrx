// Port of upstream Typeahead/TypeaheadShowcase.tsx (Astryx 0.6.4, MIT).
import { Typeahead, TypeaheadItem, createStaticSource } from '@octane-xplat/ui'
import { useState } from 'octane'

const COUNTRIES = [
	'United States',
	'United Kingdom',
	'Canada',
	'Germany',
	'France',
	'Japan',
	'Australia',
	'Brazil',
	'India',
	'Spain',
]

const source = createStaticSource(COUNTRIES.map((c) => ({ id: c, label: c })))

export function TypeaheadShowcase() @{
	const [value, setValue] = useState<{ id: string; label: string } | null>(null)

	<div style={{ width: 320 }}>
		<Typeahead
			label="Country"
			searchSource={source}
			value={value}
			onChange={setValue}
			placeholder="Start typing…"
			renderItem={(item) => <TypeaheadItem item={item} />}
		/>
	</div>
}
