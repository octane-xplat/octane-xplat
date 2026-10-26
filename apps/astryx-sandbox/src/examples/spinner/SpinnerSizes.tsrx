// Port of upstream Spinner/SpinnerSizes.tsx (Astryx 0.6.4, MIT).
import { HStack, Spinner } from '@octane-xplat/ui'

export function SpinnerSizes() @{
	<HStack gap={4} vAlign="center">
		<Spinner size="sm" />
		<Spinner size="md" />
		<Spinner size="lg" />
		<Spinner size="xl" />
	</HStack>
}
