// Port of upstream templates/pages/mixed-gallery/page.tsx (Astryx 0.6.4, MIT) —
// route /templates/mixed-gallery/.
// The responsive @container grid lives in styles/mixed-gallery.css (upstream
// shipped it in an inline <style> tag; the sandbox keeps static CSS in files).
import './styles/mixed-gallery.css'
import { AspectRatio, Heading, Layout, LayoutContent, Text, VStack } from '@octane-xplat/ui'

// Named inline-size container on the page column so the grid responds to the
// available content width (works inside the sandbox's resizable preview).
const containerStyle = {
	containerType: 'inline-size' as const,
	containerName: 'tp-mixed-gallery',
}
// Fills the AspectRatio box. No objectFit prop on AspectRatio (#2582).
const imgStyle = {
	width: '100%',
	height: '100%',
	objectFit: 'cover' as const,
}
// Rounds the image corners. No radius prop on AspectRatio (#2582).
const clipStyle = {
	borderRadius: 'var(--radius-element)',
}

interface GalleryImage {
	src: string
	title: string
}

// All landscape photos so the uniform 3:2 / 3:1 tiles crop cleanly.
const IMAGES: GalleryImage[] = [
	{ src: '/template-assets/illustrative-horizontal-1.png', title: 'Going places' },
	{ src: '/template-assets/light-home-horizontal-1.png', title: 'Making memories' },
	{ src: '/template-assets/light-lifestyle-horizontal-1.png', title: 'Being free' },
	{ src: '/template-assets/light-working-horizontal-2.png', title: 'Getting it done' },
	{ src: '/template-assets/light-scene-horizontal-1.png', title: 'Finding calm' },
]

function GalleryCard(props: { image: GalleryImage; ratio: number; className?: string }) {
	return (
		<AspectRatio ratio={props.ratio} className={props.className} style={clipStyle}>
			<img src={props.image.src} alt={props.image.title} style={imgStyle} />
		</AspectRatio>
	)
}

export function MixedGalleryTemplate() @{
	<Layout
		height="fill"
		contentWidth={1400}
		content={
			<LayoutContent padding={6}>
				<VStack gap={6} style={containerStyle}>
					{/* Header */}
					<VStack gap={2} hAlign="center">
						<Heading level={1} style={{ textAlign: 'center' }}>
							Make every day a little more delightful, one detail at a time.
						</Heading>
						<Text type="body" style={{ textAlign: 'center' }}>
							We believe the smallest details are the ones that matter most. That’s what turns an
							ordinary day into something worth remembering.
						</Text>
					</VStack>

					{/* Featured layout — a wide hero next to a single tile, above a row
					    of three. Every tile is 3:2 except the hero, which is 3:1 so that
					    (being 2 columns wide) it matches the row height exactly. */}
					<div className="tp-mixed-gallery-grid">
						<GalleryCard image={IMAGES[0]} ratio={3 / 1} className="tp-mixed-gallery-hero" />
						<GalleryCard image={IMAGES[2]} ratio={3 / 2} />
						<GalleryCard image={IMAGES[3]} ratio={3 / 2} />
						<GalleryCard image={IMAGES[4]} ratio={3 / 2} />
						<GalleryCard image={IMAGES[1]} ratio={3 / 2} />
					</div>
				</VStack>
			</LayoutContent>
		}
	/>
}
