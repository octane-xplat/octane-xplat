// Port of upstream Tokenizer/TokenizerShowcase.tsx (Astryx 0.6.4, MIT).
import { Tokenizer, createStaticSource } from '@octane-xplat/ui'
import { useState } from 'octane'

const TAGS = ['typescript', 'react', 'design-system', 'a11y', 'docs']
const source = createStaticSource(TAGS.map((t) => ({ id: t, label: t })))

export function TokenizerShowcase() @{
	const [values, setValues] = useState<{ id: string; label: string }[]>([
		{ id: 'typescript', label: 'typescript' },
	])

	<div style={{ width: 400 }}>
		<Tokenizer
			label="Tags"
			searchSource={source}
			value={values}
			onChange={setValues}
			placeholder="Add a tag…"
		/>
	</div>
}
