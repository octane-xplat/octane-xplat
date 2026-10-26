// Port of upstream ScrollableArea/ScrollableAreaTwoAxisBoard.tsx (Astryx 0.6.4, MIT).
import { Card, Grid, ScrollableArea, Text, VStack } from '@octane-xplat/ui'

const COLUMNS = ['Backlog', 'In progress', 'Review', 'Done', 'Shipped']
const CARDS = ['Board a', 'Board b', 'Board c', 'Board d']

export function ScrollableAreaTwoAxisBoard() @{
	<Card width={460} padding={0}>
		<ScrollableArea axis="both" role="region" label="Board" height={260}>
			<Grid columns={5} style={{ gap: 12, minWidth: 800, padding: 16 }}>
				{COLUMNS.map((col) => (
					<VStack key={col} gap={2}>
						<Text type="label" color="secondary">{col}</Text>
						{CARDS.map((card) => (
							<Card key={card} variant="muted" padding={3} width={140}>
								<Text type="body" maxLines={2}>{col} — {card}</Text>
							</Card>
						))}
					</VStack>
				))}
			</Grid>
		</ScrollableArea>
	</Card>
}
