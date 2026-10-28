// Port of upstream CheckboxList/CheckboxListShowcase.tsx (Astryx 0.6.4, MIT).
import { CheckboxList, CheckboxListItem } from '@octane-xplat/ui'
import { useState } from 'octane'

export function CheckboxListShowcase() @{
	const [value, setValue] = useState<string[]>(['email'])

	<CheckboxList
		label="Notification preferences"
		description="Choose how you would like to be notified"
		value={value}
		onValueChange={setValue}
		hasDividers
	>
		<CheckboxListItem label="Email" value="email" description="Weekly digest every Monday" />
		<CheckboxListItem
			label="Push notification"
			value="push"
			description="Instant alerts on your device"
		/>
		<CheckboxListItem label="SMS" value="sms" description="Standard messaging rates apply" />
	</CheckboxList>
}
