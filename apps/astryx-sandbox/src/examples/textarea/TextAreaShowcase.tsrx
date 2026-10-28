// Port of upstream TextArea/TextAreaShowcase.tsx (Astryx 0.6.4, MIT).
import { TextArea } from '@octane-xplat/ui'
import { useState } from 'octane'

export function TextAreaShowcase() @{
	const [value, setValue] = useState('')

	<div style={{ width: 400 }}>
		<TextArea
			label="Description"
			value={value}
			onChange={setValue}
			placeholder="Enter a description..."
		/>
	</div>
}
