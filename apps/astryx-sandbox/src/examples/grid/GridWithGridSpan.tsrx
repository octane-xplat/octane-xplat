// Port of upstream Grid/GridWithGridSpan.tsx (Astryx 0.6.4, MIT).
import { Card, Grid, GridSpan, Text, VStack } from '@octane-xplat/ui'

const stats = [
	['Components', '54 available'],
	['Templates', '28 available'],
	['Tokens', '120 defined'],
	['Themes', '6 published'],
	['Icons', '312 available'],
	['Patterns', '18 documented'],
	['Contributors', '42 active'],
] as const

export function GridWithGridSpan() @{
	<Grid columns={3} style={{ width: '100%', maxWidth: 500, gap: 16 }}>
		<GridSpan rows={2}>
			<Card variant="cyan">
				<VStack gap={1}>
					<Text type="label" className="sb-block">
						Featured Release
					</Text>
					<Text type="supporting" className="sb-block">
						Astryx 4.0 is now available with new layout primitives, refreshed tokens, and improved
						theming support across the system.
					</Text>
				</VStack>
			</Card>
		</GridSpan>
		{stats.map(([label, note]) => (
			<Card key={label}>
				<Text type="label" className="sb-block">
					{label}
				</Text>
				<Text type="supporting" className="sb-block">
					{note}
				</Text>
			</Card>
		))}
		<GridSpan columns="full">
			<Card variant="cyan">
				<VStack gap={1}>
					<Text type="label" className="sb-block">
						Community Showcase
					</Text>
					<Text type="supporting" className="sb-block">
						See how teams are building with Astryx across the organization
					</Text>
				</VStack>
			</Card>
		</GridSpan>
	</Grid>
}
