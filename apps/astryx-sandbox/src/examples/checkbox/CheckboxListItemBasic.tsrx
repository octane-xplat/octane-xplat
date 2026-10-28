// Port of upstream CheckboxListItem/CheckboxListItemBasic.tsx (Astryx 0.6.4, MIT).
import { CheckboxList, CheckboxListItem } from '@octane-xplat/ui'
import { useState } from 'octane'

export function CheckboxListItemBasic() @{
	const [value, setValue] = useState<string[]>(['updates'])

	<CheckboxList label="Email preferences" value={value} onValueChange={setValue}>
		<CheckboxListItem
			label="Product updates"
			value="updates"
			description="New features and improvements"
		/>
		<CheckboxListItem
			label="Security alerts"
			value="security"
			description="Important account security notifications"
		/>
		<CheckboxListItem
			label="Marketing"
			value="marketing"
			description="Tips, offers, and promotions"
		/>
	</CheckboxList>
}
