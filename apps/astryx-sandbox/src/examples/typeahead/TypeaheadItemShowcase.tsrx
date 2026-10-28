// Port of upstream TypeaheadItem/TypeaheadItemShowcase.tsx (Astryx 0.6.4, MIT).
import { Typeahead, TypeaheadItem, createStaticSource, Icon } from '@octane-xplat/ui'
import { useState } from 'octane'

const LANGUAGES = [
	{ id: 'ts', label: 'TypeScript', auxiliaryData: { description: 'Typed JavaScript' } },
	{ id: 'js', label: 'JavaScript', auxiliaryData: { description: 'The web language' } },
	{ id: 'py', label: 'Python', auxiliaryData: { description: 'General purpose' } },
	{ id: 'rs', label: 'Rust', auxiliaryData: { description: 'Systems programming' } },
]

const source = createStaticSource(LANGUAGES)

export function TypeaheadItemShowcase() @{
	const [value, setValue] = useState<(typeof LANGUAGES)[number] | null>(null)

	<div style={{ width: 320 }}>
		<Typeahead
			label="Language"
			searchSource={source}
			value={value}
			onChange={setValue}
			placeholder="Type to search…"
			renderItem={(item) => (
				<TypeaheadItem
					item={item}
					icon={<Icon name="sandbox-code" size={16} />}
					description={item.auxiliaryData?.description}
				/>
			)}
		/>
	</div>
}
