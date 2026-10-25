// Port of upstream CheckboxInput/CheckboxInputIndeterminateState.tsx (Astryx 0.6.4, MIT).
import { CheckboxInput, Stack, Divider } from '@octane-xplat/ui'
import { useState } from 'octane'

export function CheckboxInputIndeterminateState() @{
	const [items, setItems] = useState({ email: true, push: false, sms: true, slack: false })
	const checkedCount = Object.values(items).filter(Boolean).length
	const totalCount = Object.keys(items).length
	const selectAllValue = checkedCount === 0 ? false : checkedCount === totalCount ? true : 'indeterminate' as const
	const handleSelectAll = (checked: boolean) => setItems({ email: checked, push: checked, sms: checked, slack: checked })
	<Stack direction="vertical" gap={3}>
		<CheckboxInput label="Select all notifications" description={`${checkedCount} of ${totalCount} enabled`} value={selectAllValue} onChange={handleSelectAll} />
		<Divider />
		<Stack direction="vertical" gap={3}>
			<CheckboxInput label="Email notifications" value={items.email} onChange={(v) => setItems((p) => ({ ...p, email: v }))} />
			<CheckboxInput label="Push notifications" value={items.push} onChange={(v) => setItems((p) => ({ ...p, push: v }))} />
			<CheckboxInput label="SMS alerts" value={items.sms} onChange={(v) => setItems((p) => ({ ...p, sms: v }))} />
			<CheckboxInput label="Slack messages" value={items.slack} onChange={(v) => setItems((p) => ({ ...p, slack: v }))} />
		</Stack>
	</Stack>
}
