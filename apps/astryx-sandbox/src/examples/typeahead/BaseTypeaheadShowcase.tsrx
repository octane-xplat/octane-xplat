// Port of upstream BaseTypeahead/BaseTypeaheadShowcase.tsx (Astryx 0.6.4, MIT).
import { BaseTypeahead, TypeaheadItem, createStaticSource } from '@octane-xplat/ui'
import { useState } from 'octane'

const TAGS = ['typescript', 'react', 'design-system', 'components', 'accessibility', 'documentation']
const source = createStaticSource(TAGS.map((t) => ({ id: t, label: t })))

export function BaseTypeaheadShowcase() @{
	const [value, setValue] = useState<{ id: string; label: string } | null>(null)
	<div style={{width: 320}}>
		<BaseTypeahead label="Add tags" searchSource={source} value={value} onChange={setValue} placeholder="Type to search tags…" renderItem={(item) => <TypeaheadItem item={item} />} />
	</div>
}
