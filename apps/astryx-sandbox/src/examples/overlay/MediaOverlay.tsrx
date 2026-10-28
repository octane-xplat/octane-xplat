// Local composition helper for the three ported `Overlay` block examples —
// upstream `Overlay` (media scrim + positioned content) has no same-named
// Xplat equivalent (Xplat `Overlay` is the modal scrim; recorded finding).
// Composed from public View/style primitives.
import { View } from '@octane-xplat/ui'

export function MediaOverlay(props: {
	children?: any
	content?: any
	showOn?: 'always' | 'hover'
	position?: 'fill' | 'bottom'
	align?: 'start' | 'center' | 'end'
}) @{
	const justify =
		props.align === 'center' ? 'center' : props.align === 'end' ? 'flex-end' : 'flex-start'

	return (
		<View className="sb-media-overlay" style={{ position: 'relative', overflow: 'hidden' }}>
			{props.children}
			<View
				className={
					props.showOn === 'hover'
						? 'sb-media-overlay-scrim sb-media-overlay-scrim--hover'
						: 'sb-media-overlay-scrim'
				}
				style={{
					position: 'absolute',
					inset: 0,
					display: 'flex',
					alignItems: 'center',
					justifyContent: justify,
					...(props.position === 'bottom' ? { top: 'auto', alignItems: 'stretch' } : {}),
					background: 'linear-gradient(transparent, rgba(0,0,0,.55))',
				}}
			>
				{props.content}
			</View>
		</View>
	)
}
