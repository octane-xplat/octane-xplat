// Port of upstream TextInput/TextInputStatusVariant.tsx (Astryx 0.6.4, MIT).
import { TextInput, Stack, Text } from '@octane-xplat/ui'
import { useState } from 'octane'

export function TextInputStatusVariant() @{
	const [attached, setAttached] = useState('sarah@')
	const [detached, setDetached] = useState('sarah@')
	<div style={{width: 640}}>
		<Stack direction="horizontal" gap={5}>
			<Stack direction="vertical" gap={2}>
				<Text type="label">attached (default)</Text>
				<TextInput label="Email" value={attached} onChange={setAttached} placeholder="you@example.com" statusVariant="attached" status={{ type: 'error', message: 'Please enter a valid email address.' }} />
				<Text type="supporting">Message overlaps directly below the input.</Text>
			</Stack>
			<Stack direction="vertical" gap={2}>
				<Text type="label">detached</Text>
				<TextInput label="Email" value={detached} onChange={setDetached} placeholder="you@example.com" statusVariant="detached" status={{ type: 'error', message: 'Please enter a valid email address.' }} />
				<Text type="supporting">Message floats below as a separate element with spacing.</Text>
			</Stack>
		</Stack>
	</div>
}
