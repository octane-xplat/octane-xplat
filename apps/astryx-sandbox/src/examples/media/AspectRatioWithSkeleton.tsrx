// Port of upstream AspectRatio/AspectRatioWithSkeleton.tsx (Astryx 0.6.4, MIT).
// Copyright (c) Meta Platforms, Inc. and affiliates.

import { AspectRatio } from '@octane-xplat/ui'
import { Skeleton } from '@octane-xplat/ui'
import { Center } from '@octane-xplat/ui'

export function AspectRatioWithSkeleton() {
	return (
		<Center width={600}>
			<AspectRatio ratio={16 / 9}>
				<Skeleton className="sb-media-image" />
			</AspectRatio>
		</Center>
	)
}
