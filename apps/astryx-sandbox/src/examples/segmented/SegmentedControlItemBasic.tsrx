// Port of upstream SegmentedControlItem/SegmentedControlItemBasic.tsx (Astryx 0.6.4, MIT).
import { SegmentedControl, SegmentedControlItem } from '@octane-xplat/ui'
import { useState } from 'octane'

export function SegmentedControlItemBasic() @{
	const [value, setValue] = useState('all')

	<div style={{ width: 400 }}>
		<SegmentedControl value={value} onValueChange={setValue}>
			<SegmentedControlItem label="All" value="all" />
			<SegmentedControlItem label="Unread" value="unread" />
			<SegmentedControlItem label="Flagged" value="flagged" />
		</SegmentedControl>
	</div>
}
