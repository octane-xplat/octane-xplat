// Port of upstream OverflowList/OverflowListCappedToolbar.tsx (Astryx 0.6.4, MIT).
import { Button, Card, Center, DropdownMenu, OverflowList } from '@octane-xplat/ui'

const actions = ['Save', 'Edit', 'Duplicate', 'Share', 'Archive', 'Delete']

export function OverflowListCappedToolbar() @{
	<Center width={420}>
		<Card padding={2}>
			<OverflowList
				gap={2}
				maxVisibleItems={3}
				overflowRenderer={(overflowItems: { index: number }[]) => (
					<DropdownMenu
						button={{ label: `+${overflowItems.length}`, variant: 'ghost', size: 'sm' }}
						items={overflowItems.map(({ index }) => ({ type: 'action' as const, key: `action-${index}`, label: actions[index] }))}
					/>
				)}
			>
				{actions.map((action) => <Button key={action} label={action} size="sm" />)}
			</OverflowList>
		</Card>
	</Center>
}
