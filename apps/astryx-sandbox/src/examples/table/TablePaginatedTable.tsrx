// Port of upstream Table/TablePaginatedTable.tsx (Astryx 0.6.4, MIT).
import { useState } from 'octane'
import { Section, Table, paginateData, proportional, useTablePagination } from '@octane-xplat/ui'
import type { TableColumn } from '@octane-xplat/ui'

interface User extends Record<string, unknown> {
	id: string
	name: string
	email: string
	role: string
}

const names = [
	'Alice Johnson',
	'Bob Smith',
	'Charlie Brown',
	'Diana Prince',
	'Eve Davis',
	'Frank Miller',
	'Grace Lee',
	'Hank Wilson',
	'Ivy Chen',
	'Jack Turner',
	'Karen White',
	'Leo Garcia',
	'Mia Thompson',
	'Noah Martinez',
	'Olivia Clark',
	'Paul Harris',
	'Quinn Walker',
	'Rachel Adams',
	'Sam Robinson',
	'Tina Scott',
]

const roles = ['Engineer', 'Designer', 'Manager', 'Admin', 'Analyst']

const users: User[] = names.map((name, i) => ({
	id: String(i + 1),
	name,
	email: `${name.split(' ')[0].toLowerCase()}@example.com`,
	role: roles[i % roles.length]!,
}))

const columns: TableColumn<User>[] = [
	{ key: 'name', header: 'Name', width: proportional(1) },
	{ key: 'email', header: 'Email', width: proportional(2) },
	{ key: 'role', header: 'Role', width: proportional(1) },
]

export function TablePaginatedTable() @{
	const [page, setPage] = useState(1)
	const pageSize = 5

	const plugin = useTablePagination<User>({
		page,
		onPageChange: setPage,
		totalItems: users.length,
		pageSize,
	})

	<Section>
		<Table
			data={paginateData(users, page, pageSize)}
			columns={columns}
			idKey="id"
			plugins={{ pagination: plugin }}
		/>
	</Section>
}
