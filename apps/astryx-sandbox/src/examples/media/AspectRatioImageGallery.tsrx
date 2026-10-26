// Port of upstream AspectRatio/AspectRatioImageGallery.tsx (Astryx 0.6.4, MIT).
import { Image } from '@octane-xplat/ui'
// Copyright (c) Meta Platforms, Inc. and affiliates.

import { AspectRatio } from '@octane-xplat/ui'
import { Center } from '@octane-xplat/ui'
import { Grid } from '@octane-xplat/ui'

const images = [
	{ id: 1, alt: 'Mountain landscape' },
	{ id: 2, alt: 'Ocean sunset' },
	{ id: 3, alt: 'Forest trail' },
	{ id: 4, alt: 'City skyline' },
	{ id: 5, alt: 'Desert dunes' },
	{ id: 6, alt: 'Snowy peaks' },
]

export function AspectRatioImageGallery() {
	// Anchor a definite width so the grid renders in shrink-to-fit contexts
	// (e.g. the docsite example preview, which wraps blocks in a
	// `min-width: fit-content` container). Without a fixed-width ancestor,
	// the `width="100%"` grid collapses to zero — AspectRatio positions its
	// child absolutely, so it has no intrinsic width to size the grid from.
	return (
		<Center width={600}>
			<Grid columns="* * *" className="sb-image-gallery">
				{images.map(({ id, alt }) => (
					<AspectRatio key={id} ratio={4 / 3} fit="cover">
						<Image
							src="/template-assets/illustrative-horizontal-1.png"
							alt={alt}
							className="sb-aspect-gallery-image"
						/>
					</AspectRatio>
				))}
			</Grid>
		</Center>
	)
}
