// Port of upstream PowerSearch/PowerSearchSearchWithTable.tsx (Astryx 0.6.4, MIT).
import { PowerSearch, Icon, Text, createPowerSearchConfig } from '@octane-xplat/ui'
import { useState } from 'octane'
import type { PowerSearchFilterFor } from '@octane-xplat/ui'

const { config, applyFilters } = createPowerSearchConfig([
		{ key: 'name', type: 'string', label: 'Name' },
		{ key: 'status', type: 'enum', label: 'Status', enumValues: [
			{ value: 'active', label: 'Active' },
			{ value: 'archived', label: 'Archived' },
		]},
		{ key: 'owner', type: 'string', label: 'Owner' },
	], 'projects')

const ROWS = [
	{ id: '1', name: 'Project Alpha', status: 'Active', owner: 'Sarah' },
	{ id: '2', name: 'Project Beta', status: 'Archived', owner: 'Mike' },
	{ id: '3', name: 'Project Gamma', status: 'Active', owner: 'Emma' },
]

export function PowerSearchSearchWithTable() @{
	const [filters, setFilters] = useState<ReadonlyArray<PowerSearchFilterFor<typeof config>>>([])
	const statusFilter = filters.find((f) => f.field === 'status')
	const nameQuery = String(filters.find((f) => f.field === 'name')?.value ?? '').toLowerCase()
	const rows = ROWS.filter((r) =>
		(!statusFilter || r.status.toLowerCase() === String(statusFilter.value).toLowerCase()) &&
		r.name.toLowerCase().includes(nameQuery))

	<div style={{width: 560}}>
		<PowerSearch config={config} filters={filters} onChange={setFilters} placeholder="Search projects…" startIcon={<Icon name="sandbox-magnifying-glass" size={16} />} />
		<table style={{marginTop: 12, width: '100%', fontSize: 14, borderCollapse: 'collapse'}}>
			<thead><tr><th style={{textAlign: 'left', padding: 6, borderBottom: '1px solid var(--color-border, #ddd)'}}>Name</th><th style={{textAlign: 'left', padding: 6, borderBottom: '1px solid var(--color-border, #ddd)'}}>Status</th><th style={{textAlign: 'left', padding: 6, borderBottom: '1px solid var(--color-border, #ddd)'}}>Owner</th></tr></thead>
			<tbody>{rows.map((r) => <tr key={r.id}><td style={{padding: 6, borderBottom: '1px solid var(--color-border, #eee)'}}>{r.name}</td><td style={{padding: 6, borderBottom: '1px solid var(--color-border, #eee)'}}>{r.status}</td><td style={{padding: 6, borderBottom: '1px solid var(--color-border, #eee)'}}>{r.owner}</td></tr>)}</tbody>
		</table>
		{rows.length === 0 && <Text type="supporting">No matching projects.</Text>}
	</div>
}
