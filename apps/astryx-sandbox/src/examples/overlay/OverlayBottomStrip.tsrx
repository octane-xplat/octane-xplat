// Port of upstream Overlay/OverlayBottomStrip.tsx (Astryx 0.6.4, MIT).
import { AspectRatio, Badge, Text, View, VStack } from '@octane-xplat/ui'
import { MediaOverlay } from './MediaOverlay'

export function OverlayBottomStrip() @{
	return (
		<MediaOverlay
			position="bottom"
			align="start"
			content={
				<VStack gap={1} style={{ padding: 'var(--spacing-3)' }}>
					<Badge className="sb-badge--green">New</Badge>
					<Text type="body" style={{ fontWeight: 600, color: 'white' }}>
						Weekly product highlights
					</Text>
					<Text type="supporting" style={{ color: 'white' }}>
						12 updates across templates and tokens
					</Text>
				</VStack>
			}
		>
			<AspectRatio
				ratio={16 / 9}
				style={{ width: 420, maxWidth: '100%', borderRadius: 12, overflow: 'clip' }}
			>
				<View
					style={{
						width: '100%',
						height: '100%',
						background: 'linear-gradient(135deg, #b7a98c, #6b5d44)',
					}}
				/>
			</AspectRatio>
		</MediaOverlay>
	)
}
