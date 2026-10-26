// Port of upstream OverflowList/OverflowListShowcase.tsx (Astryx 0.6.4, MIT).
import { Button, Card, Center, OverflowList } from '@octane-xplat/ui'

export function OverflowListShowcase() @{
	<Center width={280}>
		<Card padding={2}>
			<OverflowList
				gap={2}
				overflowRenderer={(overflowItems: { index: number }[]) => (
					<Button label={`+${overflowItems.length}`} variant="ghost" size="sm" />
				)}
			>
				<Button label="One" size="sm" />
				<Button label="Two" size="sm" />
				<Button label="Three" size="sm" />
				<Button label="Four" size="sm" />
			</OverflowList>
		</Card>
	</Center>
}
