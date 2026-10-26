// Port of upstream PowerSearch/PowerSearchSearchWithTable.tsx (Astryx 0.6.4, MIT).
// Unit 6 revision: the raw <table> is now the public `Table` with the
// PowerSearch-filtered rows — the same narrowing pipeline the flat-table
// consumers exercise.
import { PowerSearch, Icon, Table, Text, VStack, createPowerSearchConfig } from '@octane-xplat/ui'
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

	<VStack gap={3} width={560}>
		<PowerSearch config={config} filters={filters} onChange={setFilters} placeholder="Search projects…" startIcon={<Icon name="sandbox-magnifying-glass" size={16} />} />
		<Table
			data={rows}
			columns={[
				{ key: 'name', header: 'Name' },
				{ key: 'status', header: 'Status' },
				{ key: 'owner', header: 'Owner' },
			]}
			idKey="id"
			emptyState={<Text type="supporting">No matching projects.</Text>}
		/>
	</VStack>
}
