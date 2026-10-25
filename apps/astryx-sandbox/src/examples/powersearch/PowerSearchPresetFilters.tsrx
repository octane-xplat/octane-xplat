// Port of upstream PowerSearch/PowerSearchPresetFilters.tsx (Astryx 0.6.4, MIT).
import { PowerSearch, Icon, createPowerSearchConfig } from '@octane-xplat/ui'
import { useState } from 'octane'
import type { PowerSearchFilterFor } from '@octane-xplat/ui'

const { config, applyFilters } = createPowerSearchConfig([
		{ key: 'name', type: 'string', label: 'Name' },
		{ key: 'assignee', type: 'string', label: 'Assignee' },
		{ key: 'status', type: 'enum', label: 'Status', enumValues: [
			{ value: 'todo', label: 'To do' },
			{ value: 'doing', label: 'In progress' },
			{ value: 'done', label: 'Done' },
		]},
	], 'tasks')

export function PowerSearchPresetFilters() @{
	const [filters, setFilters] = useState<ReadonlyArray<PowerSearchFilterFor<typeof config>>>([
		{ field: 'status', operator: 'is', value: ['doing'] } as unknown as PowerSearchFilterFor<typeof config>,
	])
	<PowerSearch config={config} filters={filters} onChange={setFilters} placeholder="Search with filter…" startIcon={<Icon name="sandbox-search" size={16} />} />
}
