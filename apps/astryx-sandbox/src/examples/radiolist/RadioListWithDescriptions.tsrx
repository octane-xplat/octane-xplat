// Port of upstream RadioList/RadioListWithDescriptions.tsx (Astryx 0.6.4, MIT).
import { RadioList, RadioListItem } from '@octane-xplat/ui'
import { useState } from 'octane'

export function RadioListWithDescriptions() @{
	const [value, setValue] = useState('')

	<RadioList
		label="Notification preference"
		description="Choose how you would like to be notified"
		value={value}
		onValueChange={setValue}
	>
		<RadioListItem label="Email" value="email" description="Receive notifications via email" />
		<RadioListItem label="SMS" value="sms" description="Standard messaging rates apply" />
		<RadioListItem
			label="Push notification"
			value="push"
			description="Instant alerts on your device"
		/>
	</RadioList>
}
