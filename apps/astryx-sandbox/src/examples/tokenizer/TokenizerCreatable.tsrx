// Port of upstream Tokenizer/TokenizerCreatable.tsx (Astryx 0.6.4, MIT).
import { Tokenizer, createStaticSource } from '@octane-xplat/ui'
import { useState } from 'octane'

const REVIEWERS = ['sarah', 'mike', 'emma', 'alex']
const source = createStaticSource(REVIEWERS.map((t) => ({ id: t, label: t })))

export function TokenizerCreatable() @{
	const [values, setValues] = useState<{ id: string; label: string }[]>([])
	<div style={{width: 400}}>
		<Tokenizer label="Assign reviewers" description="Type a name and press Enter to add" searchSource={source} value={values} onChange={setValues} placeholder="Add reviewer…" hasCreate />
	</div>
}
