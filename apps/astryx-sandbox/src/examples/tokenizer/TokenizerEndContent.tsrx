// Port of upstream Tokenizer/TokenizerEndContent.tsx (Astryx 0.6.4, MIT).
import { Tokenizer, Button, createStaticSource } from '@octane-xplat/ui'
import { useState } from 'octane'

const LABELS = ['bug', 'feature', 'docs']
const source = createStaticSource(LABELS.map((t) => ({ id: t, label: t })))

export function TokenizerEndContent() @{
	const [values, setValues] = useState<{ id: string; label: string }[]>([{ id: 'bug', label: 'bug' }])
	<div style={{width: 400}}>
		<Tokenizer label="Labels" searchSource={source} value={values} onChange={setValues} placeholder="Add labels…" endContent={<Button variant="primary" label="Apply" size="sm" />} />
	</div>
}
