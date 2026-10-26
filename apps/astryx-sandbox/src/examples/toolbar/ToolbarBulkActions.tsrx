// Port of upstream Toolbar/ToolbarBulkActions.tsx (Astryx 0.6.4, MIT).
// Upstream drives selection through useTableSelectionState/Table (unit-6
// contracts); re-authored with the same selection surface over a plain row
// list so the Toolbar contract is exercised without that dependency.
import { useState } from 'octane'
import { Badge, Button, Icon, List, ListItem, Stack, Toolbar } from '@octane-xplat/ui'

const DATA = [
	{ id: '1', name: 'Alex Johnson', status: 'Active', role: 'Admin' },
	{ id: '2', name: 'Sam Rivera', status: 'Active', role: 'Editor' },
	{ id: '3', name: 'Jordan Lee', status: 'Invited', role: 'Viewer' },
	{ id: '4', name: 'Taylor Kim', status: 'Active', role: 'Editor' },
	{ id: '5', name: 'Casey Park', status: 'Active', role: 'Viewer' },
]

export function ToolbarBulkActions() @{
	const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set(['1', '3', '5']))
	const toggle = (id: string) => setSelectedKeys((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
	<Stack direction="vertical">
		{selectedKeys.size > 0 && (
			<Toolbar
				label="Bulk actions"
				size="sm"
				variant="muted"
				dividers={['bottom']}
				startContent={
					<>
						<Badge label={`${selectedKeys.size} selected`} />
						<Button label="Delete" variant="ghost" icon={<Icon name="sandbox-trash" />} isIconOnly />
						<Button label="Archive" variant="ghost" icon={<Icon name="sandbox-folder" />} isIconOnly />
					</>
				}
				endContent={<Button label="Deselect all" variant="ghost" clickAction={() => setSelectedKeys(new Set())} />}
			/>
		)}
		<List hasDividers>
			{DATA.map((row) => (
				<ListItem key={row.id} label={`${row.name} — ${row.role}`} description={row.status} isSelected={selectedKeys.has(row.id)} onPress={() => toggle(row.id)} />
			))}
		</List>
	</Stack>
}
