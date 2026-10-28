// Port of upstream Card/CardElevations.tsx (Astryx 0.6.4, MIT).
import { Card, Grid, Heading, Stack, Text } from '@octane-xplat/ui'

const LEVELS = [
	{ elevation: 'none' as const, caption: 'Flat — sits on the page (default)' },
	{ elevation: 'low' as const, caption: 'Low — lifts off slightly' },
	{ elevation: 'med' as const, caption: 'Med — clearly raised' },
	{ elevation: 'high' as const, caption: 'High — floats well above' },
]

export function CardElevations() @{
	<Grid columns={2} style={{ width: 520, gap: 16 }}>
		{LEVELS.map(({ elevation, caption }) => (
			<Card key={elevation} elevation={elevation}>
				<Stack direction="vertical" gap={1}>
					<Heading level={4}>elevation="{elevation}"</Heading>
					<Text type="supporting" color="secondary">
						{caption}
					</Text>
				</Stack>
			</Card>
		))}
	</Grid>
}
