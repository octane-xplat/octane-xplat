// Port of upstream CheckboxInput/CheckboxInputShowcase.tsx (Astryx 0.6.4, MIT).
import { CheckboxInput, Stack } from '@octane-xplat/ui'
import { useState } from 'octane'

export function CheckboxInputShowcase() @{
	const [notifications, setNotifications] = useState<boolean | 'indeterminate'>(true)
	const [marketing, setMarketing] = useState<boolean | 'indeterminate'>(false)

	<Stack direction="vertical" gap={2}>
		<CheckboxInput label="Checked" value={notifications} onChange={setNotifications} />
		<CheckboxInput label="Unchecked" value={marketing} onChange={setMarketing} />
	</Stack>
}
