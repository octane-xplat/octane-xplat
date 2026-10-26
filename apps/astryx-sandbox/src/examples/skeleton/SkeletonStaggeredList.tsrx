// Port of upstream Skeleton/SkeletonStaggeredList.tsx (Astryx 0.6.4, MIT).
import { Skeleton, VStack } from '@octane-xplat/ui'

export function SkeletonStaggeredList() @{
	<VStack gap={2}>
		<Skeleton width={300} height={16} index={0} />
		<Skeleton width={280} height={16} index={1} />
		<Skeleton width={320} height={16} index={2} />
		<Skeleton width={260} height={16} index={3} />
		<Skeleton width={290} height={16} index={4} />
	</VStack>
}
