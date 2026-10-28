// Port of upstream Typeahead/TypeaheadLimitedResults.tsx (Astryx 0.6.4, MIT).
import { Typeahead, TypeaheadItem, createStaticSource } from '@octane-xplat/ui'
import { useState } from 'octane'

const FRUITS = [
	'Apple',
	'Apricot',
	'Avocado',
	'Banana',
	'Blackberry',
	'Blueberry',
	'Cherry',
	'Coconut',
	'Cranberry',
	'Fig',
	'Grape',
	'Grapefruit',
	'Kiwi',
	'Lemon',
	'Lime',
	'Mango',
	'Orange',
	'Papaya',
	'Peach',
	'Pear',
	'Pineapple',
	'Plum',
	'Raspberry',
	'Strawberry',
	'Watermelon',
]

const source = createStaticSource(FRUITS.map((f) => ({ id: f, label: f })))

export function TypeaheadLimitedResults() @{
	const [value, setValue] = useState<{ id: string; label: string } | null>(null)

	<div style={{ width: 320 }}>
		<Typeahead
			label="Favorite fruit"
			searchSource={source}
			value={value}
			onChange={setValue}
			placeholder="Start typing…"
			maxMenuItems={5}
			renderItem={(item) => <TypeaheadItem item={item} />}
		/>
	</div>
}
