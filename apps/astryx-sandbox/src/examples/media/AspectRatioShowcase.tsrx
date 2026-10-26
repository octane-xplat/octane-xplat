// Port of upstream AspectRatio/AspectRatioShowcase.tsx (Astryx 0.6.4, MIT).
import { Image } from '@octane-xplat/ui'
// Copyright (c) Meta Platforms, Inc. and affiliates.

import { AspectRatio } from '@octane-xplat/ui'
import { HStack, VStack } from '@octane-xplat/ui'
import { Text } from '@octane-xplat/ui'

const items = [
	{
		ratio: 1,
		label: '1 : 1',
		src: '/template-assets/light-home-square-1.png',
		alt: '1:1 square',
	},
	{
		ratio: 4 / 3,
		label: '4 : 3',
		src: '/template-assets/illustrative-horizontal-1.png',
		alt: '4:3 standard',
	},
	{
		ratio: 16 / 9,
		label: '16 : 9',
		src: '/template-assets/light-scene-horizontal-1.png',
		alt: '16:9 widescreen',
	},
]

export function AspectRatioShowcase() {
	return (
		<HStack gap={4} vAlign="start">
			{items.map(({ ratio, label, src, alt }) => (
				<VStack key={label} gap={2} hAlign="center">
					<AspectRatio ratio={ratio} fit="cover" className="sb-aspect-specimen">
						<Image src={src} alt={alt} />
					</AspectRatio>
					<Text type="supporting" color="secondary">
						{label}
					</Text>
				</VStack>
			))}
		</HStack>
	)
}
