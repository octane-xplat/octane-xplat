// Port of upstream Lightbox/LightboxZoom.tsx (Astryx 0.6.4, MIT).
// Copyright (c) Meta Platforms, Inc. and affiliates.

import { useState } from 'octane'
import { Lightbox } from '@octane-xplat/ui'
import { Thumbnail } from '@octane-xplat/ui'

export function LightboxZoom() {
	const [isOpen, setIsOpen] = useState(false)

	return (
		<>
			<Thumbnail
				src="/template-assets/light-scene-horizontal-1.png"
				alt="Coastal shoreline with ocean waves"
				label="Coastal shoreline with ocean waves"
				onPress={() => setIsOpen(true)}
			/>
			<Lightbox
				isOpen={isOpen}
				onOpenChange={setIsOpen}
				media={[
					{
						src: '/template-assets/light-scene-horizontal-1.png',
						alt: 'Coastal shoreline with ocean waves',
						caption: 'A scenic coastline. Click to zoom in and drag to pan.',
					},
				]}
				hasZoom
			/>
		</>
	)
}
