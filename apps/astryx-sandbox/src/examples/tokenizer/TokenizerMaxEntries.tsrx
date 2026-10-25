// Port of upstream Tokenizer/TokenizerMaxEntries.tsx (Astryx 0.6.4, MIT).
import { Tokenizer, createStaticSource } from '@octane-xplat/ui'
import { useState } from 'octane'

const ASSIGNEES = ['sarah', 'mike', 'emma', 'alex', 'jordan']
const source = createStaticSource(ASSIGNEES.map((t) => ({ id: t, label: t })))

export function TokenizerMaxEntries() @{
	const [values, setValues] = useState<{ id: string; label: string }[]>([])
	<div style={{width: 400}}>
		<Tokenizer label="Assignees" description="Up to 3 assignees" searchSource={source} value={values} onChange={setValues} placeholder="Add assignee…" maxEntries={3} />
	</div>
}
