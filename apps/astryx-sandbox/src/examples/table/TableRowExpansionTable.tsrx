// Port of upstream Table/TableRowExpansionTable.tsx (Astryx 0.6.4, MIT).
// Upstream `Badge label variant="info"` → sandbox sb-badge class (xplat Badge
// has no variant prop, matching the unit-6 adaptation).
import { useState } from 'octane'
import {
	Badge,
	Heading,
	HStack,
	Table,
	Text,
	VStack,
	pixel,
	proportional,
	useTableRowExpansion,
} from '@octane-xplat/ui'

interface Order extends Record<string, unknown> {
	id: string
	customer: string
	status: string
	total: string
	items: { name: string; qty: number; price: string }[]
}

const orders: Order[] = [
	{
		id: 'ord-1001',
		customer: 'Ada Lovelace',
		status: 'Shipped',
		total: '$248.00',
		items: [
			{ name: 'Mechanical keyboard', qty: 1, price: '$180.00' },
			{ name: 'Wrist rest', qty: 2, price: '$34.00' },
		],
	},
	{
		id: 'ord-1002',
		customer: 'Alan Turing',
		status: 'Processing',
		total: '$52.00',
		items: [{ name: 'USB-C cable', qty: 4, price: '$13.00' }],
	},
	{
		id: 'ord-1003',
		customer: 'Grace Hopper',
		status: 'Delivered',
		total: '$1,200.00',
		items: [{ name: 'Standing desk', qty: 1, price: '$1,200.00' }],
	},
]

const columns = [
	{ key: 'customer', header: 'Customer', width: proportional(2) },
	{ key: 'status', header: 'Status', width: pixel(130) },
	{ key: 'total', header: 'Total', width: pixel(110) },
]

export function TableRowExpansionTable() @{
	const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set(['ord-1001']))

	const expansion = useTableRowExpansion<Order>({
		expandedKeys,
		onToggle: (key) =>
			setExpandedKeys((prev: Set<string>) => {
				const next = new Set(prev)
				if (next.has(key)) {
					next.delete(key)
				} else {
					next.add(key)
				}

				return next
			}),
		getRowKey: (item) => item.id,
		// The detail panel renders arbitrary content below the row: here, the
		// order's line items.
		renderExpanded: (item) => (
			<VStack gap={2}>
				<Heading level={4}>Line items</Heading>
				{item.items.map((line) => (
					<HStack key={line.name} gap={3}>
						<Badge className="sb-badge sb-badge--info">x{line.qty}</Badge>
						<Text type="body">{line.name}</Text>
						<Text type="body" color="secondary">
							{line.price}
						</Text>
					</HStack>
				))}
			</VStack>
		),
	})

	<Table data={orders} columns={columns} idKey="id" hasHover plugins={{ expansion }} />
}
