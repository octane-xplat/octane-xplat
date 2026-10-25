// Port of upstream CheckboxList/CheckboxListWithEndContent.tsx (Astryx 0.6.4, MIT).
import { CheckboxList, CheckboxListItem, Badge } from '@octane-xplat/ui'
import { useState } from 'octane'

export function CheckboxListWithEndContent() @{
	const [value, setValue] = useState<string[]>(['free'])
	<CheckboxList label="Add-on packages" value={value} onValueChange={setValue} hasDividers>
		<CheckboxListItem label="Free tier" value="free" description="Basic features included" endContent={<Badge>$0/mo</Badge>} />
		<CheckboxListItem label="Pro tier" value="pro" description="Advanced analytics and integrations" endContent={<Badge>$9/mo</Badge>} />
		<CheckboxListItem label="Enterprise" value="enterprise" description="Custom solutions and dedicated support" endContent={<Badge>Custom</Badge>} />
	</CheckboxList>
}
