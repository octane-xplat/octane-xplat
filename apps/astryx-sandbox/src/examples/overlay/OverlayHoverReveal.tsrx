// Port of upstream Overlay/OverlayHoverReveal.tsx (Astryx 0.6.4, MIT).
import { AspectRatio, Button, View } from '@octane-xplat/ui'
import { MediaOverlay } from './MediaOverlay'

export function OverlayHoverReveal() @{
	return (
		<MediaOverlay showOn="hover" align="center" content={<Button label="Quick view" variant="secondary" size="sm" />}>
			<AspectRatio ratio={16 / 9} style={{ width: 420, maxWidth: '100%', borderRadius: 12, overflow: 'clip' }}>
				<View style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #9db3a8, #47615a)' }} />
			</AspectRatio>
		</MediaOverlay>
	)
}
