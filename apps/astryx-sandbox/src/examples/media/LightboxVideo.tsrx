// Port of upstream Lightbox/LightboxVideo.tsx (Astryx 0.6.4, MIT).
// Copyright (c) Meta Platforms, Inc. and affiliates.

import { useState } from 'octane'
import { Lightbox } from '@octane-xplat/ui'
import { Button } from '@octane-xplat/ui'

export function LightboxVideo() {
	const [isOpen, setIsOpen] = useState(false)

	return (
		<>
			<Button label="Play video" clickAction={() => setIsOpen(true)} />
			<Lightbox
				isOpen={isOpen}
				onOpenChange={setIsOpen}
				media={[
					{
						src: '/template-assets/Nature-1.mp4',
						alt: 'Flower blooming in time-lapse',
						type: 'video',
						caption: 'A flower blooming in time-lapse',
					},
				]}
			/>
		</>
	)
}
