// Port of upstream Overlay/OverlayShowcase.tsx (Astryx 0.6.4, MIT).
// Upstream Overlay = media scrim (name collides with Xplat modal Overlay);
// composed with View + absolute content layer; <img> → themed gradient stub.
import { AspectRatio, Button, Text, View, VStack } from '@octane-xplat/ui'
import { MediaOverlay } from './MediaOverlay'

export function OverlayShowcase() @{
	return (
		<MediaOverlay align="center" content={
			<VStack gap={2} style={{ textAlign: 'center' }}>
				<Text type="supporting" style={{ fontWeight: 600, color: 'white' }}>Design system foundations</Text>
				<Button label="Open gallery" variant="secondary" size="sm" />
			</VStack>
		}>
			<AspectRatio ratio={16 / 9} style={{ width: 520, maxWidth: '100%', borderRadius: 16, overflow: 'clip' }}>
				<View style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #7c8ba1, #3d4a63)' }} />
			</AspectRatio>
		</MediaOverlay>
	)
}
