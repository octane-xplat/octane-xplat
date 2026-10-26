// Port of upstream GridSpan/GridSpanShowcase.tsx (Astryx 0.6.4, MIT).
import { Card, Grid, GridSpan, Text } from '@octane-xplat/ui'

export function GridSpanShowcase() @{
	<Grid columns={4} style={{width: 400, gap: 12}}>
		<GridSpan columns={3}>
			<Card height={80}><Text type="body" color="secondary">Spans 3 columns</Text></Card>
		</GridSpan>
		<Card height={80}><Text type="body" color="secondary">1 col</Text></Card>
		<GridSpan rows={2}>
			<Card><Text type="body" color="secondary">1 col</Text></Card>
		</GridSpan>
		<GridSpan columns={3}>
			<Card height={80}><Text type="body" color="secondary">Full-width row</Text></Card>
		</GridSpan>
		<Card height={80}><Text type="body" color="secondary">1 col</Text></Card>
		<GridSpan columns={2}>
			<Card height={80}><Text type="body" color="secondary">Spans 2 columns</Text></Card>
		</GridSpan>
	</Grid>
}
