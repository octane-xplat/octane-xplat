// Port of upstream Table/TableShowcase.tsx (Astryx 0.6.4, MIT).
import { Card, Table, pixel, proportional } from '@octane-xplat/ui'
import type { TableColumn } from '@octane-xplat/ui'

interface User extends Record<string, unknown> {
	id: string
	name: string
	email: string
	role: string
	age: number
}

const users: User[] = [
	{ id: '1', name: 'Alice Johnson', email: 'alice@example.com', role: 'Engineer', age: 30 },
	{ id: '2', name: 'Bob Smith', email: 'bob@example.com', role: 'Designer', age: 25 },
	{ id: '3', name: 'Charlie Brown', email: 'charlie@example.com', role: 'PM', age: 35 },
]

const columns: TableColumn<User>[] = [
	{ key: 'name', header: 'Name', width: proportional(1) },
	{ key: 'email', header: 'Email', width: proportional(2) },
	{ key: 'role', header: 'Role', width: proportional(1) },
	{ key: 'age', header: 'Age', width: pixel(80) },
]

export function TableShowcase() @{
	<Card style={{ width: 600, maxWidth: '100%' }}>
		<Table data={users} columns={columns} idKey="id" hasHover />
	</Card>
}
