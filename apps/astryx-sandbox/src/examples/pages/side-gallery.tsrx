// Port of upstream templates/pages/side-gallery/page.tsx (Astryx 0.6.4, MIT) —
// route /templates/side-gallery/.
// GAPS: Grid `gap`/`align` are not props — they move into style.
import { AspectRatio, Button, Divider, Grid, Heading, HStack, Layout, LayoutContent, Text, VStack } from '@octane-xplat/ui'

const imageStyle = {
	width: '100%',
	height: '100%',
	objectFit: 'cover' as const,
}

const imageClip = {
	borderRadius: 'var(--radius-element)',
}

const IMAGES = [
	{ src: '/template-assets/colorful-lifestyle-vertical-3.png', alt: 'Colorful lifestyle scene' },
	{ src: '/template-assets/colorful-lifestyle-horizontal-1.png', alt: 'Colorful lifestyle horizontal' },
	{ src: '/template-assets/colorful-lifestyle-vertical-1.png', alt: 'Colorful lifestyle vertical' },
	{ src: '/template-assets/colorful-home-vertical-2.png', alt: 'Colorful home interior' },
	{ src: '/template-assets/colorful-home-vertical-3.png', alt: 'Colorful home scene' },
	{ src: '/template-assets/colorful-home-vertical-1.png', alt: 'Colorful home vertical' },
	{ src: '/template-assets/colorful-lifestyle-horizontal-2.png', alt: 'Colorful lifestyle wide' },
	{ src: '/template-assets/colorful-lifestyle-vertical-2.png', alt: 'Colorful lifestyle detail' },
	{ src: '/template-assets/colorful-lifestyle-vertical-4.png', alt: 'Colorful lifestyle portrait' },
]

function StatBlock(props: { value: string; label: string }) {
	return (
		<VStack gap={0}>
			<Text type="large" weight="bold">
				{props.value}
			</Text>
			<Text type="supporting" color="secondary">
				{props.label}
			</Text>
		</VStack>
	)
}

function ImageGrid() {
	return (
		<Grid columns={3} style={{ gap: 12 }}>
			{IMAGES.map((img) => (
				<AspectRatio key={img.src} ratio={1} style={imageClip}>
					<img src={img.src} alt={img.alt} style={imageStyle} />
				</AspectRatio>
			))}
		</Grid>
	)
}

export function SideGalleryTemplate() @{
	<Layout
		height="fill"
		contentWidth={1400}
		content={
			<LayoutContent padding={6}>
				<Grid columns={{ minWidth: 360, repeat: 'fit' }} style={{ gap: 32, alignItems: 'center' }}>
					{/* Left side: Text + CTA */}
					<VStack gap={6} vAlign="center">
						<VStack gap={3}>
							<Text type="supporting" color="secondary" weight="semibold">
								COLORFUL
							</Text>
							<Heading level={1}>
								Make every day a little more delightful, one small detail at a time.
							</Heading>
							<Text type="body" color="secondary">
								The smallest details are the ones that matter most. A little color that catches your
								eye and makes you pause; that’s what turns an ordinary day into something worth
								remembering.
							</Text>
						</VStack>

						<HStack gap={3} vAlign="center">
							<Button label="Explore" variant="primary" />
						</HStack>

						<VStack gap={4}>
							<Divider />
							<HStack gap={6}>
								<StatBlock value="12k+" label="Photos" />
								<StatBlock value="350+" label="Projects" />
								<StatBlock value="8yrs" label="Experience" />
							</HStack>
						</VStack>
					</VStack>

					{/* Right side: Image Grid */}
					<ImageGrid />
				</Grid>
			</LayoutContent>
		}
	/>
}
