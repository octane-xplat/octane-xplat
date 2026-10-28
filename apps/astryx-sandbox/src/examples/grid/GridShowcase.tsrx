// Port of upstream Grid/GridShowcase.tsx (Astryx 0.6.4, MIT).
import { Card, Grid } from '@octane-xplat/ui'

export function GridShowcase() @{
	<Grid columns={3} style={{ width: 400, gap: 8 }}>
		{Array.from({ length: 12 }, (_, i) => (
			<Card key={i}>Item {i + 1}</Card>
		))}
	</Grid>
}
