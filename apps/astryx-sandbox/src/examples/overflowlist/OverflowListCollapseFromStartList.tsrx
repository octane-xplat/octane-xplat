// Port of upstream OverflowList/OverflowListCollapseFromStartList.tsx (Astryx 0.6.4, MIT).
import { Button, Card, Center, OverflowList } from '@octane-xplat/ui'

export function OverflowListCollapseFromStartList() @{
	<Center width={300}>
		<Card padding={2}>
			<OverflowList
				gap={2}
				collapseFrom="start"
				overflowRenderer={(overflowItems: { index: number }[]) => (
					<Button label={`+${overflowItems.length} more`} variant="ghost" size="sm" />
				)}
			>
				<Button label="Step 1" size="sm" />
				<Button label="Step 2" size="sm" />
				<Button label="Step 3" size="sm" />
				<Button label="Step 4" size="sm" />
				<Button label="Step 5" size="sm" />
			</OverflowList>
		</Card>
	</Center>
}
