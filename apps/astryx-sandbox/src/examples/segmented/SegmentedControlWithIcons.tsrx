// Port of upstream SegmentedControl/SegmentedControlWithIcons.tsx (Astryx 0.6.4, MIT).
import { SegmentedControl, SegmentedControlItem, Icon } from '@octane-xplat/ui'
import { useState } from 'octane'

export function SegmentedControlWithIcons() @{
	const [value, setValue] = useState('list')
	<div style={{width: 500}}>
		<SegmentedControl value={value} onValueChange={setValue}>
			<SegmentedControlItem label="List" value="list" icon={<Icon name="sandbox-list-bullet" size={16} />} />
			<SegmentedControlItem label="Grid" value="grid" icon={<Icon name="sandbox-squares" size={16} />} />
			<SegmentedControlItem label="Table" value="table" icon={<Icon name="sandbox-table-cells" size={16} />} />
		</SegmentedControl>
	</div>
}
