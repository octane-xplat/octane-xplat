// Port of upstream Table/TableGroupedRowsTable.tsx (Astryx 0.6.4, MIT).
import { useState } from 'octane'
import { Table, pixel, proportional, useTableGroupedRows } from '@octane-xplat/ui'
import type { TableColumn } from '@octane-xplat/ui'

interface Person extends Record<string, unknown> {
	id: string
	name: string
	team: string
	role: string
}

const people: Person[] = [
	{ id: '1', name: 'Ava Chen', team: 'Design Systems', role: 'Staff Eng' },
	{ id: '2', name: 'Liam Park', team: 'Design Systems', role: 'Engineer' },
	{ id: '3', name: 'Zoe Vega', team: 'Design Systems', role: 'Manager' },
	{ id: '4', name: 'Max Ross', team: 'Infra', role: 'Senior Eng' },
	{ id: '5', name: 'Mia Cole', team: 'Infra', role: 'Engineer' },
	{ id: '6', name: 'Leo Nash', team: 'Growth', role: 'PM' },
]

const columns: TableColumn<Person>[] = [
	{ key: 'name', header: 'Name', width: proportional(2) },
	{ key: 'role', header: 'Role', width: pixel(140) },
]

export function TableGroupedRowsTable() @{
	const [collapsedGroups, setCollapsed] = useState<Set<string>>(new Set())
	const onToggleGroup = (key: string) => {
		setCollapsed((prev: Set<string>) => {
			const next = new Set(prev)
			if (next.has(key)) {
				next.delete(key)
			} else {
				next.add(key)
			}

			return next
		})
	}

	const grouped = useTableGroupedRows<Person>({
		data: people,
		groupBy: (p) => p.team,
		collapsedGroups,
		onToggleGroup,
		getRowKey: (p) => p.id,
	})

	<Table
		data={grouped.data}
		columns={columns}
		idKey={grouped.idKey}
		hasHover
		plugins={{ grouped: grouped.plugin }}
	/>
}
