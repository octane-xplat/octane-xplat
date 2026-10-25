// Port of upstream SegmentedControl/SegmentedControlDisabledItem.tsx (Astryx 0.6.4, MIT).
import { SegmentedControl, SegmentedControlItem } from '@octane-xplat/ui'
import { useState } from 'octane'

export function SegmentedControlDisabledItem() @{
	const [value, setValue] = useState('active')
	<div style={{width: 400}}>
		<SegmentedControl value={value} onValueChange={setValue}>
			<SegmentedControlItem label="Active" value="active" />
			<SegmentedControlItem label="Archived" value="archived" />
			<SegmentedControlItem label="Deleted" value="deleted" isDisabled />
		</SegmentedControl>
	</div>
}
