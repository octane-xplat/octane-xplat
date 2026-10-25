// Port of upstream Tokenizer/TokenizerIcon.tsx (Astryx 0.6.4, MIT).
import { Tokenizer, Icon, createStaticSource } from '@octane-xplat/ui'
import { useState } from 'octane'

const TAGS = ['work', 'personal', 'project']
const source = createStaticSource(TAGS.map((t) => ({ id: t, label: t })))

export function TokenizerIcon() @{
	const [values, setValues] = useState<{ id: string; label: string }[]>([{ id: 'work', label: 'work' }, { id: 'personal', label: 'personal' }])
	<div style={{width: 400}}>
		<Tokenizer label="Tags" searchSource={source} value={values} onChange={setValues} placeholder="Add a tag…" startIcon={<Icon name="sandbox-tag" size={16} />} />
	</div>
}
