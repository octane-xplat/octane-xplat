// Port of upstream RadioList/RadioListPricingTier.tsx (Astryx 0.6.4, MIT).
import { RadioList, RadioListItem, Text } from '@octane-xplat/ui'
import { useState } from 'octane'

export function RadioListPricingTier() @{
	const [value, setValue] = useState('')
	<RadioList label="Plan" value={value} onValueChange={setValue}>
		<RadioListItem label="Free" value="free" endContent={<Text className="sb-type-body sb-color-secondary">$0/mo</Text>} />
		<RadioListItem label="Pro" value="pro" endContent={<Text className="sb-type-body sb-color-secondary">$9/mo</Text>} />
		<RadioListItem label="Enterprise" value="enterprise" endContent={<Text className="sb-type-body sb-color-secondary">Custom</Text>} />
	</RadioList>
}
