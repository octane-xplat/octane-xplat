// Port of upstream TextArea/TextAreaCharacterCount.tsx (Astryx 0.6.4, MIT).
import { TextArea } from '@octane-xplat/ui'
import { useState } from 'octane'

export function TextAreaCharacterCount() @{
	const [value, setValue] = useState('Excited to announce that our team just shipped the new dashboard! Check it out and let us know what you think.')
	<div style={{width: 400}}>
		<TextArea label="Status update" value={value} onChange={setValue} placeholder="What's on your mind?" maxLength={280} rows={3} />
	</div>
}
