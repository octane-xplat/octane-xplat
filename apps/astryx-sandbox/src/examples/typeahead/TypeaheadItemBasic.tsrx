// Port of upstream TypeaheadItem/TypeaheadItemBasic.tsx (Astryx 0.6.4, MIT).
import { Typeahead, TypeaheadItem, createStaticSource } from '@octane-xplat/ui'
import { useState } from 'octane'

const LANGUAGES = [
	{ id: 'ts', label: 'TypeScript' },
	{ id: 'js', label: 'JavaScript' },
	{ id: 'py', label: 'Python' },
	{ id: 'rs', label: 'Rust' },
]

const source = createStaticSource(LANGUAGES)

export function TypeaheadItemBasic() @{
	const [value, setValue] = useState<(typeof LANGUAGES)[number] | null>(null)

	<div style={{ width: 320 }}>
		<Typeahead
			label="Language"
			searchSource={source}
			value={value}
			onChange={setValue}
			placeholder="Type to search…"
			renderItem={(item) => <TypeaheadItem item={item} />}
		/>
	</div>
}
