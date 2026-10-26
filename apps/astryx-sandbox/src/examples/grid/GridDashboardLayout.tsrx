// Port of upstream Grid/GridDashboardLayout.tsx (Astryx 0.6.4, MIT).
// Upstream `Grid gap` was removed from the public contract — spacing comes
// from an inline style gap; GridSpan lands via public placement props.
import { Card, Grid, GridSpan, Text } from '@octane-xplat/ui'

const metrics = [
	{ label: 'Revenue', value: '$48,290' },
	{ label: 'Active Users', value: '12,841' },
	{ label: 'Conversion', value: '3.2%' },
	{ label: 'Avg Response', value: '245ms' },
]

export function GridDashboardLayout() @{
	<Grid columns={4} style={{width: "100%", maxWidth: 500, gap: 16}}>
		<GridSpan columns={2} rows={2}>
			<Card>
				<Text type="label" className="sb-block">Weekly Traffic</Text>
				<Text type="supporting" className="sb-block">Page views and unique visitors over the last 7 days</Text>
			</Card>
		</GridSpan>
		{metrics.map((m) => (
			<Card key={m.label}>
				<Text type="supporting" className="sb-block">{m.label}</Text>
				<Text type="label" className="sb-block">{m.value}</Text>
			</Card>
		))}
		<GridSpan columns="full">
			<Card>
				<Text type="label" className="sb-block">Recent Activity</Text>
				<Text type="supporting" className="sb-block">Latest events across all projects</Text>
			</Card>
		</GridSpan>
	</Grid>
}
