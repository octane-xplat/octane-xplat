// Port of upstream SegmentedControl/SegmentedControlIconOnly.tsx (Astryx 0.6.4, MIT).
import { SegmentedControl, SegmentedControlItem, Icon } from '@octane-xplat/ui'
import { useState } from 'octane'

export function SegmentedControlIconOnly() @{
	const [value, setValue] = useState('grid')

	<SegmentedControl value={value} onValueChange={setValue} accessibilityLabel="Choose view mode">
		<SegmentedControlItem
			label="Grid view"
			value="grid"
			icon={<Icon name="sandbox-squares" size={16} />}
			isLabelHidden
		/>
		<SegmentedControlItem
			label="List view"
			value="list"
			icon={<Icon name="sandbox-list-bullet" size={16} />}
			isLabelHidden
		/>
		<SegmentedControlItem
			label="Table view"
			value="table"
			icon={<Icon name="sandbox-table-cells" size={16} />}
			isLabelHidden
		/>
	</SegmentedControl>
}
