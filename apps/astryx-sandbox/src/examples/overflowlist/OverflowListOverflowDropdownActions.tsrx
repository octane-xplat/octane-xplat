// Port of upstream OverflowList/OverflowListOverflowDropdownActions.tsx (Astryx 0.6.4, MIT).
import { Button, Card, DropdownMenu, OverflowList } from '@octane-xplat/ui'

const actions = ['Save', 'Edit', 'Duplicate', 'Share', 'Archive', 'Delete']

export function OverflowListOverflowDropdownActions() @{
	<Card
		padding={2}
		style={{
			resize: 'horizontal',
			overflow: 'hidden',
			minWidth: 100,
			width: 350,
			maxWidth: '100%',
		}}
	>
		<OverflowList
			gap={2}
			overflowRenderer={(overflowItems: { index: number }[]) => (
				<DropdownMenu
					button={{ label: `+${overflowItems.length}`, variant: 'ghost', size: 'sm' }}
					items={overflowItems.map(({ index }) => ({
						type: 'action' as const,
						key: `action-${index}`,
						label: actions[index],
						onSelect: () => {},
					}))}
				/>
			)}
		>
			<Button label="Save" size="sm" variant="primary" />
			<Button label="Edit" size="sm" />
			<Button label="Duplicate" size="sm" />
			<Button label="Share" size="sm" />
			<Button label="Archive" size="sm" />
			<Button label="Delete" size="sm" variant="destructive" />
		</OverflowList>
	</Card>
}
