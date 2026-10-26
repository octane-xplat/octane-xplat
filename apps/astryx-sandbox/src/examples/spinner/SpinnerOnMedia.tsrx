// Port of upstream Spinner/SpinnerOnMedia.tsx (Astryx 0.6.4, MIT).
import { HStack, Spinner } from '@octane-xplat/ui'

export function SpinnerOnMedia() @{
	<HStack gap={4} vAlign="center">
		<Spinner shade="default" />
		<div style={{ backgroundColor: '#1a1a2e', padding: 16, borderRadius: 8 }}>
			<Spinner shade="onMedia" />
		</div>
	</HStack>
}
