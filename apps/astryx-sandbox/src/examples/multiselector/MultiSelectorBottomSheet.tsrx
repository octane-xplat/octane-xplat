// Port of upstream MultiSelector/MultiSelectorBottomSheet.tsx (Astryx 0.6.4, MIT).
import { MultiSelector } from '@octane-xplat/ui'
import { useState } from 'octane'

export function MultiSelectorBottomSheet() @{
	const [value, setValue] = useState<string[]>([])
	<div style={{width: 320}}>
		<MultiSelector presentation="bottom-sheet" label="Notification channels" options={[
			{ value: 'email', label: 'Email' },
			{ value: 'push', label: 'Push notifications' },
			{ value: 'sms', label: 'SMS' },
			{ value: 'slack', label: 'Slack' },
		]} value={value} onValueChange={setValue} placeholder="Select channels" />
	</div>
}
