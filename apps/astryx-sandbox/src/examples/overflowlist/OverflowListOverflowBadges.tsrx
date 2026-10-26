// Port of upstream OverflowList/OverflowListOverflowBadges.tsx (Astryx 0.6.4, MIT).
import { Badge, Card, OverflowList } from '@octane-xplat/ui'

export function OverflowListOverflowBadges() @{
	<Card padding={2} style={{ resize: 'horizontal', overflow: 'hidden', minWidth: 80, width: 300 }}>
		<OverflowList
			gap={1}
			overflowRenderer={(overflowItems: { index: number }[]) => (
				<Badge variant="neutral" label={`+${overflowItems.length}`} />
			)}
		>
			<Badge variant="info" label="React" />
			<Badge variant="success" label="TypeScript" />
			<Badge variant="warning" label="StyleX" />
			<Badge variant="neutral" label="Storybook" />
			<Badge variant="error" label="Vitest" />
		</OverflowList>
	</Card>
}
