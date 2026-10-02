/** @jsxImportSource @octane-xplat/macos-renderer */
import { useState } from 'octane'
import type { LightboxProps } from './props'
import { cx } from './cx'
import { Button } from './controls.macos.tsrx'
import { LayerDepthProvider, useLayerDismissal } from './layer-dismissal.tsrx'
import { usePresentation } from './presentation.macos.tsrx'

function LightboxPanel(props: LightboxProps & { dark?: boolean; layerDepth: number; currentIndex: number; setIndex: (i: number) => void }) @{
	const item = props.media[props.currentIndex]

	<LayerDepthProvider value={props.layerDepth}>
	<flexboxlayout flexDirection="column" id={props.id} className={cx('vx-lightbox', props.dark && 'ns-dark', props.className)} style={props.style}>
		<flexboxlayout flexDirection="row" alignItems="center">
			<Button accessibilityLabel="Previous media" disabled={props.currentIndex === 0} onPress={() => props.setIndex(props.currentIndex - 1)}>Previous</Button>
			<label className="vx-lightbox-counter">{`${props.currentIndex + 1} of ${props.media.length}`}</label>
			<Button accessibilityLabel="Next media" disabled={props.currentIndex === props.media.length - 1} onPress={() => props.setIndex(props.currentIndex + 1)}>Next</Button>
			<Button accessibilityLabel="Close lightbox" onPress={() => props.onOpenChange(false)}>×</Button>
		</flexboxlayout>
		{item?.type === 'video' ? (
			<label whiteSpace="normal">{`Video playback is unavailable in the shared macOS lightbox. ${item.alt}`}</label>
		) : (
			<scrollview className="vx-lightbox-scroll">
				<image src={item?.src} accessibilityLabel={item?.alt} />
			</scrollview>
		)}
		{item?.caption != null && <label whiteSpace="normal">{item.caption}</label>}
	</flexboxlayout>
	</LayerDepthProvider>
}

export function Lightbox(props: LightboxProps) @{
	const [internal, setInternal] = useState(props.defaultIndex ?? 0)
	const count = props.media.length
	const index = Math.min(Math.max(props.index ?? internal, 0), Math.max(0, count - 1))
	const setIndex = (value: number) => {
		const next = Math.min(Math.max(value, 0), Math.max(0, count - 1))
		if (props.index == null) setInternal(next)
		if (next !== index) props.onIndexChange?.(next)
	}

	const dismissal = useLayerDismissal({
		get active() { return props.isOpen && count > 0 },
		dismiss: () => props.onOpenChange(false),
		behavior: 'close',
		getFocusTarget: () => props.finalFocusRef?.current,
		restoreFocus: false,
	})

	const owner = usePresentation(props.isOpen && count > 0, LightboxPanel, { ...props, layerDepth: dismissal.depth, currentIndex: index, setIndex }, {
		kind: 'lightbox', modal: true, label: props.media[index]?.alt ?? 'Media viewer',
		zoom: props.hasZoom ?? true, finalFocusRef: props.finalFocusRef,
		canDismiss: () => dismissal.shouldClose(),
		onDismiss: () => props.onOpenChange(false),
		onKey: (key: number) => {
			if (key === 123) { setIndex(index - 1); return true }
			if (key === 124) { setIndex(index + 1); return true }
			return false
		},
	})

	<flexboxlayout ref={owner} style={{ width: 0, height: 0 }} />
}
