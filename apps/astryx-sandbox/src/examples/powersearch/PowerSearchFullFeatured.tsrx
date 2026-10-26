// Port of upstream PowerSearch/PowerSearchFullFeatured.tsx (Astryx 0.6.4, MIT).
import { PowerSearch, Icon, createPowerSearchConfig } from '@octane-xplat/ui'
import { useState } from 'octane'
import type { PowerSearchFilterFor } from '@octane-xplat/ui'

const { config, applyFilters } = createPowerSearchConfig([
		{ key: 'name', type: 'string', label: 'Name' },
		{ key: 'owner', type: 'string', label: 'Owner' },
		{ key: 'status', type: 'enum', label: 'Status', enumValues: [
			{ value: 'active', label: 'Active' },
			{ value: 'archived', label: 'Archived' },
		]},
		{ key: 'modified', type: 'date', label: 'Last modified' },
		{ key: 'size', type: 'number', label: 'Size (KB)' },
	], 'everything')

export function PowerSearchFullFeatured() @{
	const [filters, setFilters] = useState<ReadonlyArray<PowerSearchFilterFor<typeof config>>>([])
	<PowerSearch config={config} filters={filters} onChange={setFilters} placeholder="Search everything…" startIcon={<Icon name="sandbox-magnifying-glass" size={16} />} hasClear />
}
