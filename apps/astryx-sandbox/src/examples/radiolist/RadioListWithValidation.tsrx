// Port of upstream RadioList/RadioListWithValidation.tsx (Astryx 0.6.4, MIT).
import { RadioList, RadioListItem } from '@octane-xplat/ui'
import { useState } from 'octane'

export function RadioListWithValidation() @{
	const [value, setValue] = useState('')
	<RadioList label="Notification preference" isRequired status={value === '' ? { type: 'error', message: 'Please select a notification method' } : undefined} value={value} onValueChange={setValue}>
		<RadioListItem label="Email" value="email" />
		<RadioListItem label="SMS" value="sms" />
		<RadioListItem label="Push notification" value="push" />
	</RadioList>
}
