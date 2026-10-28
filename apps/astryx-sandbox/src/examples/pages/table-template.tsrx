// Port of upstream templates/pages/table/page.tsx (Astryx 0.6.4, MIT) —
// route /templates/table/.
import { useState } from 'octane'
import {
	Badge,
	Button,
	HStack,
	Layout,
	LayoutContent,
	LayoutHeader,
	Table,
	Text,
} from '@octane-xplat/ui'

import type { TableColumn } from '@octane-xplat/ui'

type Item = {
	id: string
	name: string
	status: 'active' | 'inactive'
	updatedAt: string
}

const SAMPLE_DATA: Item[] = [
	{ id: '1', name: 'Item One', status: 'active', updatedAt: '2025-01-15' },
	{ id: '2', name: 'Item Two', status: 'inactive', updatedAt: '2025-01-14' },
	{ id: '3', name: 'Item Three', status: 'active', updatedAt: '2025-01-13' },
]

const columns: TableColumn<Item>[] = [
	{
		key: 'name',
		header: 'Name',
		renderCell: (item: Item) => <Text weight="semibold">{item.name}</Text>,
	},
	{
		key: 'status',
		header: 'Status',
		renderCell: (item: Item) => (
			<span
				className={
					item.status === 'active' ? 'sb-badge sb-badge--green' : 'sb-badge sb-badge--neutral'
				}
			>
				{item.status}
			</span>
		),
	},
	{
		key: 'updatedAt',
		header: 'Updated',
		renderCell: (item: Item) => <Text color="secondary">{item.updatedAt}</Text>,
	},
	{
		key: 'actions',
		header: 'Actions',
		renderCell: () => <Button label="Edit" variant="secondary" size="sm" />,
	},
]

export function TableTemplate() @{
	const [data] = useState<Item[]>(SAMPLE_DATA)

	<Layout
		header={
			<LayoutHeader hasDivider>
				<HStack vAlign="center" hAlign="between">
					<Text type="large" weight="semibold">
						Items
					</Text>
					<Button label="Add Item" variant="primary" />
				</HStack>
			</LayoutHeader>
		}
		content={
			<LayoutContent>
				<Table data={data} columns={columns} idKey="id" hasHover />
			</LayoutContent>
		}
	/>
}
