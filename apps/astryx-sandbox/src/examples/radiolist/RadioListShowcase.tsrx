// Port of upstream RadioList/RadioListShowcase.tsx (Astryx 0.6.4, MIT).
import { RadioList, RadioListItem } from '@octane-xplat/ui'
import { useState } from 'octane'

export function RadioListShowcase() @{
	const [value, setValue] = useState('')

	<RadioList label="Notification preference" value={value} onValueChange={setValue}>
		<RadioListItem label="Email" value="email" />
		<RadioListItem label="SMS" value="sms" />
		<RadioListItem label="Push notification" value="push" />
	</RadioList>
}
