// Port of upstream Lightbox/LightboxShowcase.tsx (Astryx 0.6.4, MIT).
import { Button } from '@octane-xplat/ui'
// Copyright (c) Meta Platforms, Inc. and affiliates.

import { useState } from 'octane'
import { Lightbox } from '@octane-xplat/ui'

export function LightboxShowcase() {
	const [isOpen, setIsOpen] = useState(false)
	return (
		<>
			<Button clickAction={() => setIsOpen(true)} label="View image" />
			<Lightbox
				isOpen={isOpen}
				onOpenChange={setIsOpen}
				media={[
					{
						src: '/template-assets/light-scene-horizontal-1.png',
						alt: 'Coastal shoreline with ocean waves',
						caption:
							'A scenic coastline with waves rolling onto a sandy beach beneath a clear sky.',
					},
				]}
			/>
		</>
	)
}
