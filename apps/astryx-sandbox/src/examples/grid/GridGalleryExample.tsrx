// Port of upstream Grid/GridGalleryExample.tsx (Astryx 0.6.4, MIT).
import { Card, Grid, Text, VStack } from '@octane-xplat/ui'

const cards = [
	{ title: 'Getting Started', description: 'Learn the basics of the platform.' },
	{ title: 'Components', description: 'Browse the full component library.' },
	{ title: 'Design Tokens', description: 'Colors, spacing, and typography.' },
	{ title: 'Theming', description: 'Customize the look and feel.' },
	{ title: 'Accessibility', description: 'Build inclusive experiences.' },
	{ title: 'Patterns', description: 'Common UI composition patterns.' },
]

export function GridGalleryExample() @{
	<Grid columns={{ minWidth: 180 }} style={{width: "100%", maxWidth: 400, gap: 20}}>
		{cards.map((card) => (
			<Card key={card.title}>
				<VStack gap={1}>
					<Text type="label" className="sb-block">{card.title}</Text>
					<Text type="supporting" className="sb-block">{card.description}</Text>
				</VStack>
			</Card>
		))}
	</Grid>
}
