// Port of upstream PowerSearch/PowerSearchContentSearch.tsx (Astryx 0.6.4, MIT).
import { PowerSearch, Icon, createPowerSearchConfig } from '@octane-xplat/ui'
import { useState } from 'octane'
import type { PowerSearchFilterFor } from '@octane-xplat/ui'

const { config, applyFilters } = createPowerSearchConfig([
		{ key: 'title', type: 'string', label: 'Title' },
		{ key: 'section', type: 'enum', label: 'Section', enumValues: [
			{ value: 'getting-started', label: 'Getting started' },
			{ value: 'components', label: 'Components' },
			{ value: 'api', label: 'API' },
		]},
	], 'docs')

export function PowerSearchContentSearch() @{
	const [filters, setFilters] = useState<ReadonlyArray<PowerSearchFilterFor<typeof config>>>([])
	<PowerSearch config={config} filters={filters} onChange={setFilters} placeholder="Search documentation…" startIcon={<Icon name="sandbox-magnifying-glass" size={16} />} />
}
