// Port of upstream Carousel/CarouselShowcase.tsx (Astryx 0.6.4, MIT).
// Upstream `aria-label` maps to the Carousel `label` prop.
import { Card, Carousel, Heading, Stack, Text } from '@octane-xplat/ui'

const ITEMS = [
	{ title: 'Design', body: 'Create wireframes and prototypes.' },
	{ title: 'Develop', body: 'Build components and pages.' },
	{ title: 'Test', body: 'Write tests and fix bugs.' },
	{ title: 'Deploy', body: 'Ship to production.' },
	{ title: 'Monitor', body: 'Track performance and errors.' },
]

export function CarouselShowcase() {
	return (
		<Carousel gap={2} hasSnap hasButtons={false} label="Workflow steps" style={{ maxWidth: 500 }}>
			{ITEMS.map((item) => (
				<Card key={item.title} padding={3} style={{ minWidth: 200 }}>
					<Stack direction="vertical" gap={1}>
						<Heading level={5}>{item.title}</Heading>
						<Text type="supporting" color="secondary">
							{item.body}
						</Text>
					</Stack>
				</Card>
			))}
		</Carousel>
	)
}
