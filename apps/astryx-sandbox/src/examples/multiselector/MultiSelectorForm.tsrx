// Port of upstream MultiSelector/MultiSelectorForm.tsx (Astryx 0.6.4, MIT).
import { MultiSelector } from '@octane-xplat/ui'
import { useState } from 'octane'

export function MultiSelectorForm() @{
	const [channels, setChannels] = useState<string[]>([])
	const empty = channels.length === 0

	<div style={{ width: 320 }}>
		<MultiSelector
			label="Notify via"
			isRequired
			status={empty ? { type: 'error', message: 'Please select at least one channel' } : undefined}
			options={[
				{ value: 'email', label: 'Email' },
				{ value: 'push', label: 'Push notifications' },
				{ value: 'sms', label: 'SMS' },
			]}
			value={channels}
			onValueChange={setChannels}
			placeholder="Select channels"
		/>
	</div>
}
