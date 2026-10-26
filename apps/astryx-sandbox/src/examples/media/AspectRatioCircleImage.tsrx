// Port of upstream AspectRatio/AspectRatioCircleImage.tsx (Astryx 0.6.4, MIT).
import { Image } from '@octane-xplat/ui'
// Copyright (c) Meta Platforms, Inc. and affiliates.

import { AspectRatio } from '@octane-xplat/ui'
import { Center } from '@octane-xplat/ui'

export function AspectRatioCircleImage() {
	return (
		<Center width={300}>
			<AspectRatio ratio={1} shape="ellipse" fit="cover">
				<Image src="/template-assets/light-home-square-1.png" alt="Circular image" />
			</AspectRatio>
		</Center>
	)
}
