// Port of upstream Skeleton/SkeletonTableRowSkeleton.tsx (Astryx 0.6.4, MIT).
import { HStack, Skeleton, VStack } from '@octane-xplat/ui'

export function SkeletonTableRowSkeleton() @{
	<VStack gap={2}>
		{[0, 1, 2, 3].map((row) => (
			<HStack key={row} gap={4} vAlign="center">
				<Skeleton width={50} height={16} index={row * 4} />
				<Skeleton width={180} height={16} index={row * 4 + 1} />
				<Skeleton width={100} height={16} index={row * 4 + 2} />
				<Skeleton width={80} height={16} index={row * 4 + 3} />
			</HStack>
		))}
	</VStack>
}
