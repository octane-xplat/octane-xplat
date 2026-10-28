// Port of upstream Tokenizer/TokenizerOverflow.tsx (Astryx 0.6.4, MIT).
import { Tokenizer, createStaticSource } from '@octane-xplat/ui'
import { useState } from 'octane'

const VERSIONS = ['alpha', 'beta', 'gamma', 'delta', 'epsilon']
const source = createStaticSource(VERSIONS.map((t) => ({ id: t, label: t })))

export function TokenizerOverflow() @{
	const [values, setValues] = useState<{ id: string; label: string }[]>(
		VERSIONS.map((t) => ({ id: t, label: t })),
	)

	<div style={{ width: 400 }}>
		<Tokenizer
			label="Versions"
			searchSource={source}
			value={values}
			onChange={setValues}
			placeholder="Add version…"
			tokenOverflowBehavior="unfocusedInline"
		/>
	</div>
}
