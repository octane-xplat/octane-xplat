// Port of upstream RadioListItem/RadioListItemShowcase.tsx (Astryx 0.6.4, MIT).
import { RadioList, RadioListItem } from '@octane-xplat/ui'
import { useState } from 'octane'

export function RadioListItemShowcase() @{
	const [value, setValue] = useState('standard')
	<RadioList label="Shipping method" value={value} onValueChange={setValue}>
		<RadioListItem label="Standard" value="standard" description="5–7 business days" />
		<RadioListItem label="Express" value="express" description="2–3 business days" />
		<RadioListItem label="Overnight" value="overnight" description="Next business day" />
		<RadioListItem label="Same day" value="sameday" description="Not available in your area" isDisabled />
	</RadioList>
}
