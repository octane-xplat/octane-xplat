// Port of upstream Table/ColumnResizeHookUsage.tsx (Astryx 0.6.4, MIT).
import { useState } from 'octane'
import { Table, pixel, proportional, useTableColumnResize } from '@octane-xplat/ui'

interface User extends Record<string, unknown> {
	id: string
	name: string
	email: string
	role: string
}

const users: User[] = [
	{ id: '1', name: 'Alice Johnson', email: 'alice@example.com', role: 'Engineer' },
	{ id: '2', name: 'Bob Smith', email: 'bob@example.com', role: 'Designer' },
	{ id: '3', name: 'Charlie Brown', email: 'charlie@example.com', role: 'PM' },
	{ id: '4', name: 'Diana Prince', email: 'diana@example.com', role: 'Engineer' },
	{ id: '5', name: 'Eve Davis', email: 'eve@example.com', role: 'Analyst' },
]

const columns = [
	{ key: 'name', header: 'Name' },
	{ key: 'email', header: 'Email', width: proportional(2) },
	{ key: 'role', header: 'Role', width: pixel(120) },
]

export function ColumnResizeHookUsage() @{
	const [columnWidths, setColumnWidths] = useState<Record<string, number>>({})

	const columnResize = useTableColumnResize({
		columnWidths,
		columns,
		onColumnResizeEnd: (updates) => {
			setColumnWidths((prev: Record<string, number>) => ({ ...prev, ...updates }))
		},
	})

	<Table data={users} columns={columns} idKey="id" hasHover plugins={{ columnResize }} />
}
