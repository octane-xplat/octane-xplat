// Port of upstream templates/pages/gallery-hero/page.tsx (Astryx 0.6.4, MIT) —
// route /templates/gallery-hero/.
// GAPS: Text `justify`/`textWrap` props unported → style. Grid `gap` is not a
// prop upstream-side here — gap moves into style (recorded convention).
// ArrowRightIcon 20/solid → 24/outline registry glyph.
import { AspectRatio, Button, Grid, Heading, HStack, Icon, Layout, LayoutContent, Text, VStack } from '@octane-xplat/ui'

const IMAGES = [
	{
		src: '/template-assets/colorful-home-horizontal-1.png',
		alt: 'Colorful home interior with vibrant decor',
	},
	{
		src: '/template-assets/colorful-lifestyle-horizontal-1.png',
		alt: 'Colorful lifestyle portrait with natural lighting',
	},
	{
		src: '/template-assets/colorful-lifestyle-horizontal-2.png',
		alt: 'Colorful lifestyle scene with warm tones',
	},
]

// Fills the AspectRatio box. No objectFit prop on AspectRatio (#2582).
const galleryImage = {
	width: '100%',
	height: '100%',
	objectFit: 'cover' as const,
}
// Rounds the image corners. No radius prop on AspectRatio (#2582).
const galleryImageClip = {
	borderRadius: 'var(--radius-container)',
}
const textCenter = {
	textAlign: 'center' as const,
	textWrap: 'balance' as const,
}

export function GalleryHeroTemplate() @{
	<Layout
		content={
			<LayoutContent padding={6}>
				<VStack gap={10}>
					<VStack gap={6} hAlign="center">
						<VStack gap={3} hAlign="center">
							<Heading level={1} type="display-2" style={textCenter}>
								Little joys, everywhere you go
							</Heading>
							<Text type="body" color="secondary" style={textCenter}>
								Sometimes all it takes is one small thing to turn your whole day around.
							</Text>
						</VStack>
						<HStack gap={3}>
							<Button
								label="Get started"
								variant="primary"
								endContent={<Icon name="sandbox-arrow-right" size={16} color="inherit" />}
							/>
							<Button label="Learn more" variant="secondary" />
						</HStack>
					</VStack>
					<Grid columns={{ minWidth: 200, repeat: 'fit' }} style={{ gap: 16 }}>
						{IMAGES.map((image) => (
							<AspectRatio key={image.src} ratio={4 / 5} style={galleryImageClip}>
								<img style={galleryImage} src={image.src} alt={image.alt} />
							</AspectRatio>
						))}
					</Grid>
				</VStack>
			</LayoutContent>
		}
	/>
}
