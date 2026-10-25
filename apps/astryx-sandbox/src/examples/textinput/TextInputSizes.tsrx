// Port of upstream TextInput/TextInputSizes.tsx (Astryx 0.6.4, MIT).
import { TextInput, Stack } from '@octane-xplat/ui'
import { useState } from 'octane'

export function TextInputSizes() @{
	const [sm, setSm] = useState('')
	const [md, setMd] = useState('')
	const [lg, setLg] = useState('')
	<div style={{width: 300}}>
		<Stack direction="vertical" gap={3}>
			<TextInput label="Small" value={sm} onChange={setSm} placeholder="Enter a value" size="sm" />
			<TextInput label="Medium" value={md} onChange={setMd} placeholder="Enter a value" size="md" />
			<TextInput label="Large" value={lg} onChange={setLg} placeholder="Enter a value" size="lg" />
		</Stack>
	</div>
}
