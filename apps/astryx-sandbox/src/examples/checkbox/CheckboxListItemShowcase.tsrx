// Port of upstream CheckboxListItem/CheckboxListItemShowcase.tsx (Astryx 0.6.4, MIT).
import { CheckboxList, CheckboxListItem } from '@octane-xplat/ui'
import { useState } from 'octane'

export function CheckboxListItemShowcase() @{
	const [value, setValue] = useState<string[]>(['updates', 'security'])
	<CheckboxList label="Email preferences" value={value} onValueChange={setValue} hasDividers>
		<CheckboxListItem label="Product updates" value="updates" description="New features and improvements" />
		<CheckboxListItem label="Security alerts" value="security" description="Important account security notifications" />
		<CheckboxListItem label="Marketing" value="marketing" description="Tips, offers, and promotions" />
		<CheckboxListItem label="Beta program" value="beta" description="Currently closed to new members" isDisabled />
	</CheckboxList>
}
