// Port of upstream Table/TableBulkActionsTable.tsx (Astryx 0.6.4, MIT).
import { useState } from 'octane'
import {
	Button,
	Table,
	TableSelectionToolbar,
	View,
	proportional,
	useTableSelection,
	useTableSelectionState,
} from '@octane-xplat/ui'

import type { TableColumn } from '@octane-xplat/ui'

interface User extends Record<string, unknown> {
	id: string
	name: string
	email: string
	role: string
}

const users: User[] = [
	{ id: '1', name: 'Alice', email: 'alice@example.com', role: 'Engineer' },
	{ id: '2', name: 'Bob', email: 'bob@example.com', role: 'Designer' },
	{ id: '3', name: 'Charlie', email: 'charlie@example.com', role: 'Manager' },
	{ id: '4', name: 'Diana', email: 'diana@example.com', role: 'Engineer' },
	{ id: '5', name: 'Eve', email: 'eve@example.com', role: 'Admin' },
]

const columns: TableColumn<User>[] = [
	{ key: 'name', header: 'Name', width: proportional(1) },
	{ key: 'email', header: 'Email', width: proportional(2) },
	{ key: 'role', header: 'Role', width: proportional(1) },
]

export function TableBulkActionsTable() @{
	const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set())

	const { selectionConfig, selectionState } = useTableSelectionState<User>({
		data: users,
		idKey: 'id',
		selectedKeys,
		setSelectedKeys,
	})

	const selectionPlugin = useTableSelection<User>(selectionConfig)

	<View>
		<TableSelectionToolbar
			selection={selectionState}
			startContent={
				<>
					<Button label="Export" variant="ghost" clickAction={() => {}} />
					<Button label="Delete" variant="ghost" clickAction={selectionState.clearSelection} />
				</>
			}
		/>
		<Table data={users} columns={columns} idKey="id" plugins={{ selection: selectionPlugin }} />
	</View>
}
