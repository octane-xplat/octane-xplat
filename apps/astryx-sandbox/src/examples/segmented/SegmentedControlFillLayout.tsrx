// Port of upstream SegmentedControl/SegmentedControlFillLayout.tsx (Astryx 0.6.4, MIT).
import { SegmentedControl, SegmentedControlItem } from '@octane-xplat/ui'
import { useState } from 'octane'

export function SegmentedControlFillLayout() @{
	const [value, setValue] = useState('profile')

	<div style={{ width: 500 }}>
		<SegmentedControl value={value} onValueChange={setValue} layout="fill">
			<SegmentedControlItem label="Profile" value="profile" />
			<SegmentedControlItem label="Security" value="security" />
			<SegmentedControlItem label="Billing" value="billing" />
		</SegmentedControl>
	</div>
}
