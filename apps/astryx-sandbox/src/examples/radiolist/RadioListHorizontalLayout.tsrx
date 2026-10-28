// Port of upstream RadioList/RadioListHorizontalLayout.tsx (Astryx 0.6.4, MIT).
import { RadioList, RadioListItem } from '@octane-xplat/ui'
import { useState } from 'octane'

export function RadioListHorizontalLayout() @{
	const [value, setValue] = useState('md')

	<RadioList label="Size" horizontal value={value} onValueChange={setValue}>
		<RadioListItem label="Small" value="sm" />
		<RadioListItem label="Medium" value="md" />
		<RadioListItem label="Large" value="lg" />
	</RadioList>
}
