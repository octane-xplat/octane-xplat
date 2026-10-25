// Port of upstream SegmentedControlItem/SegmentedControlItemShowcase.tsx (Astryx 0.6.4, MIT).
import { SegmentedControl, SegmentedControlItem, Icon } from '@octane-xplat/ui'
import { useState } from 'octane'

export function SegmentedControlItemShowcase() @{
	const [value, setValue] = useState('grid')
	<div style={{width: 400}}>
		<SegmentedControl value={value} onValueChange={setValue}>
			<SegmentedControlItem label="Grid" value="grid" icon={<Icon name="sandbox-squares" size={16} />} />
			<SegmentedControlItem label="List" value="list" icon={<Icon name="sandbox-list-bullet" size={16} />} />
			<SegmentedControlItem label="Board" value="board" icon={<Icon name="sandbox-view-columns" size={16} />} isDisabled />
		</SegmentedControl>
	</div>
}
