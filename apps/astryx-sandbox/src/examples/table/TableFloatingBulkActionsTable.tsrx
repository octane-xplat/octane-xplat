// Port of upstream Table/TableFloatingBulkActionsTable.tsx (Astryx 0.6.4,
// MIT). The upstream stylex sticky-toolbar styling maps to sandbox CSS
// classes in sandbox.css (.sb-bulk-*).
import { useState } from 'octane'
import {
	Button,
	Table,
	TableSelectionToolbar,
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

const METRICS = [
	['Active users', '12,840'],
	['Selection rate', '18.4%'],
	['Pending reviews', '247'],
] as const

export function TableFloatingBulkActionsTable() @{
	const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set())

	const { selectionConfig, selectionState } = useTableSelectionState<User>({
		data: users,
		idKey: 'id',
		selectedKeys,
		setSelectedKeys,
	})

	const selectionPlugin = useTableSelection<User>(selectionConfig)

	<div className="sb-bulk-page">
		<div className="sb-bulk-metrics">
			{METRICS.map(([label, value]) => (
				<div key={label} className="sb-bulk-metric-card">
					<span className="sb-bulk-metric-label">{label}</span>
					<strong className="sb-bulk-metric-value">{value}</strong>
				</div>
			))}
		</div>
		<div className="sb-bulk-table-region">
			<TableSelectionToolbar
				selection={selectionState}
				className="sb-bulk-toolbar"
				startContent={<Button label="Approve" variant="ghost" clickAction={() => {}} />}
			/>
			<Table data={users} columns={columns} idKey="id" plugins={{ selection: selectionPlugin }} />
		</div>
	</div>
}
