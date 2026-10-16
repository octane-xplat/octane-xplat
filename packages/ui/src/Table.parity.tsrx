// Measured parity fixtures — assertions live in Table.parity.check.ts.
import { Table } from './Table'
import { View } from './View'
import type { ParityFixture } from './parity'

function TableFixture() @{
	<Table
		className="parity-table-root"
		style={{ width: 220, height: 96, backgroundColor: '#f5f5f5' }}
		columns={[
			{ key: 'name', label: '', width: 100 },
			{ key: 'status', label: '', width: 100 },
		]}
		rows={[{ name: 'Profile', status: 'Ready' }, { name: 'Security', status: 'Pending' }]}
		renderCell={() => <View className="parity-table-cell-content" style={{ width: 64, height: 24 }} />}
	/>
}

export const PARITY: ParityFixture[] = [
	{ name: 'table-two-rows', component: 'Table', renderer: TableFixture, props: {}, height: 112 },
]
