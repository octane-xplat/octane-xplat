// Port of upstream TextInput/TextInputShowcase.tsx (Astryx 0.6.4, MIT).
import { TextInput } from '@octane-xplat/ui'
import { useState } from 'octane'

export function TextInputShowcase() @{
	const [value, setValue] = useState('')

	<div style={{ width: 300 }}>
		<TextInput label="Name" value={value} onChange={setValue} placeholder="Enter your name" />
	</div>
}
