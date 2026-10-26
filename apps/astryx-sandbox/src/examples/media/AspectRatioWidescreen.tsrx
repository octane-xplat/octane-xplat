// Port of upstream AspectRatio/AspectRatioWidescreen.tsx (Astryx 0.6.4, MIT).
import { Image } from '@octane-xplat/ui'
// Copyright (c) Meta Platforms, Inc. and affiliates.

import { AspectRatio } from '@octane-xplat/ui'
import { Center } from '@octane-xplat/ui'

export function AspectRatioWidescreen() {
	return (
		<Center width={600}>
			<AspectRatio ratio={16 / 9} fit="cover">
				<Image src="/template-assets/light-scene-horizontal-1.png" alt="16:9 widescreen" />
			</AspectRatio>
		</Center>
	)
}
