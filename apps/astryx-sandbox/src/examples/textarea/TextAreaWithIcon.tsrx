// Port of upstream TextArea/TextAreaWithIcon.tsx (Astryx 0.6.4, MIT).
import { TextArea, Icon } from '@octane-xplat/ui'
import { useState } from 'octane'

export function TextAreaWithIcon() @{
	const [value, setValue] = useState('')
	<div style={{width: 400}}>
		<TextArea label="Meeting notes" description="Capture key decisions and action items." value={value} onChange={setValue} placeholder="What was discussed?" startIcon={<Icon name="sandbox-pencil-square" size={16} />} />
	</div>
}
