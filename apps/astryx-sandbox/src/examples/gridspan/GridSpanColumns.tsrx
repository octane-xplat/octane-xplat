// Port of upstream GridSpan/GridSpanColumns.tsx (Astryx 0.6.4, MIT).
import { Card, Grid, GridSpan, Text } from '@octane-xplat/ui'

export function GridSpanColumns() @{
	<Grid columns={3} style={{ width: 400, gap: 12 }}>
		<GridSpan columns={2}>
			<Card height={80}>
				<Text type="body" color="secondary">
					Spans 2 columns
				</Text>
			</Card>
		</GridSpan>
		<Card height={80}>
			<Text type="body" color="secondary">
				1 col
			</Text>
		</Card>
		<Card height={80}>
			<Text type="body" color="secondary">
				1 col
			</Text>
		</Card>
		<GridSpan columns={2}>
			<Card height={80}>
				<Text type="body" color="secondary">
					Spans 2 columns
				</Text>
			</Card>
		</GridSpan>
	</Grid>
}
