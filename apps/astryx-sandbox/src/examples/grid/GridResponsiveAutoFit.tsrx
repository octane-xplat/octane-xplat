// Port of upstream Grid/GridResponsiveAutoFit.tsx (Astryx 0.6.4, MIT).
import { Card, Grid, Layout, LayoutContent, LayoutPanel, ResizeHandle, Text, useResizable, VStack } from '@octane-xplat/ui'

const teams = [
	{ name: 'Design Systems', members: 8 },
	{ name: 'Frontend Platform', members: 12 },
	{ name: 'Developer Experience', members: 6 },
	{ name: 'Accessibility', members: 4 },
	{ name: 'Performance', members: 7 },
	{ name: 'Mobile Infrastructure', members: 9 },
]

export function GridResponsiveAutoFit() @{
	const gridPanel = useResizable({ defaultSize: 480, minSize: 100, maxSize: 480 })
	<Card variant="muted" padding={0} height={400} width="100%" style={{ maxWidth: 500 }}>
		<Layout
			height="fill"
			start={
				<>
					<LayoutPanel width={gridPanel.size} hasDivider={false} style={{ padding: 'var(--spacing-4, 16px)' }}>
						<Grid columns={{ minWidth: 180, repeat: 'fit' }} style={{width: "100%", gap: 16}}>
							{teams.map((team) => (
								<Card key={team.name}>
									<VStack gap={1}>
										<Text type="label" className="sb-block">{team.name}</Text>
										<Text type="supporting" className="sb-block">{team.members} members</Text>
									</VStack>
								</Card>
							))}
						</Grid>
					</LayoutPanel>
					<ResizeHandle direction="horizontal" hasDivider isAlwaysVisible resizable={gridPanel.props} label="Resize grid" />
				</>
			}
			content={<LayoutContent />}
		/>
	</Card>
}
