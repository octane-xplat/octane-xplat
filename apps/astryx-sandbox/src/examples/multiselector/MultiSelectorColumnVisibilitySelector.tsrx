// Port of upstream MultiSelector/MultiSelectorColumnVisibilitySelector.tsx (Astryx 0.6.4, MIT).
import { MultiSelector } from '@octane-xplat/ui'
import { useState } from 'octane'

export function MultiSelectorColumnVisibilitySelector() @{
	const [visibleColumns, setVisibleColumns] = useState<string[]>(['name', 'status', 'owner'])

	<div style={{ width: 400 }}>
		<MultiSelector
			options={[
				{ value: 'name', label: 'Name' },
				{ value: 'status', label: 'Status' },
				{ value: 'owner', label: 'Owner' },
				{ value: 'last-modified', label: 'Last modified' },
				{ value: 'size', label: 'Size' },
				{ value: 'type', label: 'Type' },
			]}
			value={visibleColumns}
			onValueChange={setVisibleColumns}
			placeholder="Select columns"
			triggerDisplay="badges"
		/>
	</div>
}
