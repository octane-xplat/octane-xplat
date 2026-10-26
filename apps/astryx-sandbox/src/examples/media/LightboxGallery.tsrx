// Port of upstream Lightbox/LightboxGallery.tsx (Astryx 0.6.4, MIT).
// Copyright (c) Meta Platforms, Inc. and affiliates.

import { useLightbox } from '@octane-xplat/ui'
import { Grid } from '@octane-xplat/ui'
import { Thumbnail } from '@octane-xplat/ui'

const PHOTOS = [
	{
		src: '/template-assets/Neutral-Backpack.png',
		alt: 'Backpack',
		caption: 'A backpack displayed on a neutral background.',
	},
	{
		src: '/template-assets/building.png',
		alt: 'Modern building',
		caption: 'A modern building with a contemporary architectural design.',
	},
	{
		src: '/template-assets/light-scene-horizontal-1.png',
		alt: 'Coastal shoreline with ocean waves',
		caption: 'A scenic coastline with waves rolling onto a sandy beach beneath a clear sky.',
	},
	{
		src: '/template-assets/illustrative-vertical-1.png',
		alt: 'Illustrated lakeside landscape at sunset',
		caption:
			'A stylized landscape illustration featuring pink clouds reflected over a calm lake at sunset.',
	},
]

export function LightboxGallery() {
	const lightbox = useLightbox({ media: PHOTOS })

	return (
		<>
			<Grid columns="* *" className="sb-lightbox-gallery">
				{PHOTOS.map((photo, i) => (
					<Thumbnail
						key={photo.src}
						src={photo.src}
						alt={photo.alt}
						label={photo.alt}
						onPress={() => lightbox.open(i)}
					/>
				))}
			</Grid>
			{lightbox.element}
		</>
	)
}
