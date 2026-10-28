// Port of upstream Tokenizer/TokenizerStates.tsx (Astryx 0.6.4, MIT).
import { Tokenizer, Stack, createStaticSource } from '@octane-xplat/ui'
import { useState } from 'octane'

const TAGS = ['alpha', 'beta', 'locked']
const source = createStaticSource(TAGS.map((t) => ({ id: t, label: t })))

export function TokenizerStates() @{
	const [required, setRequired] = useState<{ id: string; label: string }[]>([])
	const [disabled, setDisabled] = useState<{ id: string; label: string }[]>([
		{ id: 'locked', label: 'locked' },
	])

	const [error, setError] = useState<{ id: string; label: string }[]>([])

	<Stack direction="vertical" gap={4} style={{ width: 400 }}>
		<Tokenizer
			label="Required"
			isRequired
			status={{ type: 'error', message: 'At least one tag is required' }}
			searchSource={source}
			value={required}
			onChange={setRequired}
			placeholder="Add tags…"
		/>
		<Tokenizer
			label="Disabled"
			isDisabled
			searchSource={source}
			value={disabled}
			onChange={setDisabled}
			placeholder="Add tags…"
		/>
		<Tokenizer
			label="Loading"
			isLoading
			searchSource={source}
			value={error}
			onChange={setError}
			placeholder="Add tags…"
		/>
	</Stack>
}
