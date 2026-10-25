// Port of upstream Typeahead/TypeaheadWithValidation.tsx (Astryx 0.6.4, MIT).
import { Typeahead, TypeaheadItem, createStaticSource } from '@octane-xplat/ui'
import { useState } from 'octane'

const TECHNOLOGIES = ['React', 'Vue', 'Angular', 'Svelte', 'Next.js', 'Remix', 'Astro', 'Nuxt']
const source = createStaticSource(TECHNOLOGIES.map((t) => ({ id: t, label: t })))

export function TypeaheadWithValidation() @{
	const [value, setValue] = useState<{ id: string; label: string } | null>(null)
	const status = value == null
		? { type: 'error' as const, message: 'Please select a technology from the list' }
		: undefined
	<div style={{width: 320}}>
		<Typeahead label="Framework" isRequired status={status} searchSource={source} value={value} onChange={setValue} placeholder="Start typing…" renderItem={(item) => <TypeaheadItem item={item} />} />
	</div>
}
