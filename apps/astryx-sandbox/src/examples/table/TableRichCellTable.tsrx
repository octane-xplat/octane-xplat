// Port of upstream Table/TableRichCellTable.tsx (Astryx 0.6.4, MIT).
// Upstream `Badge variant` values (blue/purple/green) map to the sandbox's
// sb-badge classes — xplat Badge has no variant prop.
import { Badge, Link, Table, pixel, proportional } from '@octane-xplat/ui'
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
	{ id: '4', name: 'Diana Prince', email: 'diana@example.com', role: 'Engineer', age: 28 },
	{ id: '5', name: 'Eve Davis', email: 'eve@example.com', role: 'Designer', age: 32 },
]

const roleClass: Record<string, string> = {
	Engineer: 'sb-badge sb-badge--blue',
	Designer: 'sb-badge sb-badge--purple',
	PM: 'sb-badge sb-badge--green',
}

const columns: TableColumn<User>[] = [
	{ key: 'name', header: 'Name' },
	{
		key: 'email',
		header: 'Email',
		width: proportional(2),
		renderCell: (item) => <Link href={`mailto:${item.email}`}>{item.email}</Link>,
	},
	{
		key: 'role',
		header: 'Role',
		renderCell: (item) => <span className={roleClass[item.role] ?? 'sb-badge'}>{item.role}</span>,
	},
	{ key: 'age', header: 'Age', width: pixel(80) },
]

export function TableRichCellTable() @{
	<Table data={users} columns={columns} idKey="id" hasHover />
}
