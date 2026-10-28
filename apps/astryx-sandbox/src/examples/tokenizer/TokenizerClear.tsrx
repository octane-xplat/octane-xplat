// Port of upstream Tokenizer/TokenizerClear.tsx (Astryx 0.6.4, MIT).
import { Tokenizer, createStaticSource } from '@octane-xplat/ui'
import { useState } from 'octane'

const LABELS = ['frontend', 'urgent', 'backend', 'design']
const source = createStaticSource(LABELS.map((t) => ({ id: t, label: t })))

export function TokenizerClear() @{
	const [values, setValues] = useState<{ id: string; label: string }[]>([
		{ id: 'frontend', label: 'frontend' },
		{ id: 'urgent', label: 'urgent' },
	])

	<div style={{ width: 400 }}>
		<Tokenizer
			label="Labels"
			searchSource={source}
			value={values}
			onChange={setValues}
			placeholder="Add labels…"
			hasClear
		/>
	</div>
}
