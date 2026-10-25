// Port of upstream PowerSearch/PowerSearchShowcase.tsx (Astryx 0.6.4, MIT).
import { PowerSearch, Icon, createPowerSearchConfig } from '@octane-xplat/ui'
import { useState } from 'octane'
import type { PowerSearchFilterFor } from '@octane-xplat/ui'

const { config, applyFilters } = createPowerSearchConfig([
		{ key: 'title', type: 'string', label: 'Title' },
		{ key: 'author', type: 'string', label: 'Author' },
		{ key: 'created', type: 'date', label: 'Created' },
		{ key: 'status', type: 'enum', label: 'Status', enumValues: [
			{ value: 'draft', label: 'Draft' },
			{ value: 'review', label: 'In review' },
			{ value: 'published', label: 'Published' },
		]},
	], 'documents')

export function PowerSearchShowcase() @{
	const [filters, setFilters] = useState<ReadonlyArray<PowerSearchFilterFor<typeof config>>>([])
	<PowerSearch config={config} filters={filters} onChange={setFilters} placeholder="Search…" startIcon={<Icon name="sandbox-search" size={16} />} />
}
