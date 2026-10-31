/** @jsxImportSource @octane-xplat/jsx */
import Gtk from 'gi://Gtk?version=4.0'
import Gdk from 'gi://Gdk?version=4.0'
import { mergeStyle } from '../../internal/layout/style-merge'
import { useEffect, useRef, useState } from 'octane'
import { createPortal } from '../../internal/platform/native-portal'
import type { LightboxProps, LightboxMedia } from '../../props'
import { cx } from '@octane-xplat/lib'
import { useLayerDismissal, LayerDepthProvider } from './layer-dismissal.tsrx'
import { themeSchemeClasses } from '../../theme/theme-host'
import { Icon } from '../media/Icon'
import { Pressable } from '../actions/Pressable'
import { Text } from '../content/Text'

const clampIndex = (i: number, count: number) =>
	count <= 0 ? 0 : Math.min(Math.max(i, 0), count - 1)

/** The overlay-layer body: dark stage, centered media, swipe to navigate,
 *  buttons + counter + caption chrome. */
function LightboxPanel(props: {
	media: LightboxMedia[]
	index: number
	setIndex: (i: number) => void
	onClose: () => void
	hasZoom: boolean
	layerDepth: number
	className?: any
}) @{
	const { media, index } = props
	const count = media.length
	const item = media[index]
	const [zoomed, setZoomed] = useState(false)
	const isVideo = item?.type === 'video'
	const imgView = useRef<any>(null)
	const panAcc = useRef({ x: 0, y: 0 })

	const onStagePan = (e: any) => {
		const el = imgView.current
		if (!zoomed || !el) {
			return
		}

		// GTK pan states are 'began'/'moved'/'ended'/'cancelled' strings.
		if (e.state !== 'moved') {
			return
		}

		const dx = e.dx ?? e.deltaX ?? 0
		const dy = e.dy ?? e.deltaY ?? 0
		panAcc.current = { x: dx, y: dy }
		el.translateX = dx
		el.translateY = dy
	}

	const toggleZoom = () => {
		const el = imgView.current
		const next = !zoomed
		setZoomed(next)
		// GTK ref.animate implements translate only — write the transform
		// directly (instant zoom, same contract).
		if (el) {
			el.scaleX = next ? 2 : 1
			el.scaleY = next ? 2 : 1
			el.translateX = 0
			el.translateY = 0
		}

		panAcc.current = { x: 0, y: 0 }
	}

	const onSwipe = (e: any) => {
		// SwipeDirection: right=1, left=2
		if (e.direction === 2) {
			props.setIndex(Math.min(index + 1, count - 1))
		} else if (e.direction === 1) {
			props.setIndex(Math.max(index - 1, 0))
		}
	}

	<LayerDepthProvider value={props.layerDepth}>
		<masonview
			className={cx('vx-lightbox', themeSchemeClasses(), props.className)}
			onSwipe={onSwipe}
			// GestureDrag claims every sequence it sees, which would starve
			// the swipe gesture — pan is only bound while zoomed.
			onPan={zoomed ? onStagePan : undefined}
			accessibilityLabel={item?.alt ?? 'Media viewer'}
			style={{
				display: 'grid',
				gridTemplateRows: '1fr',
				gridTemplateColumns: '1fr',
				// The portal target is a Gtk.Box — flexGrow is what expands a
				// child there (a percentage height still measures at content
				// size), so the stage fills the window like the native
				// RootLayout presentation.
				flexGrow: 1,
				width: '100%',
				height: '100%',
			}}
		>
			{count > 0 && (
				<masonview
					style={mergeStyle(
						{ display: 'grid', gridTemplateRows: '1fr auto', gridTemplateColumns: '1fr' },
						{ justifySelf: 'stretch', alignSelf: 'stretch' },
					)}
				>
					<masonview
						style={mergeStyle(
							{ display: 'grid' },
							{ gridRow: '1', justifySelf: 'stretch', alignSelf: 'stretch' },
						)}
					>
						{item != null &&
							(isVideo ? (
								<masonview
									style={mergeStyle(
										{ flexDirection: 'column' },
										mergeStyle({ display: 'flex' }, { justifySelf: 'center', alignSelf: 'center' }),
									)}
									className="vx-lightbox-video-fallback"
								>
									<label className="vx-lightbox-caption" textWrap={true}>
										{item.alt}
									</label>
								</masonview>
							) : (
								<image
									ref={(v: any) => {
										imgView.current = v
									}}
									src={item.src}
									stretch="aspectFit"
									className="vx-lightbox-media"
									accessibilityLabel={item.alt}
									onDoubleTap={props.hasZoom ? toggleZoom : undefined}
									style={{ justifySelf: 'center', alignSelf: 'center' }}
								/>
							))}
					</masonview>
					<masonview
						style={mergeStyle(
							{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
							mergeStyle({ display: 'flex' }, { gridRow: '2' }),
						)}
						className="vx-lightbox-footer"
					>
						<Pressable
							className="vx-lightbox-nav"
							accessibilityLabel="Previous"
							onPress={() => props.setIndex(Math.max(index - 1, 0))}
							disabled={index <= 0}
						>
							<Icon name="xplat-chevron-left" />
						</Pressable>
						<masonview
							style={mergeStyle(
								{ flexDirection: 'column', alignItems: 'center', flexGrow: 1 },
								{ display: 'flex' },
							)}
						>
							{count > 1 && <Text className="vx-lightbox-counter">{`${index + 1} of ${count}`}</Text>}
							{item?.caption != null &&
								(typeof item.caption === 'string' ? (
									<Text className="vx-lightbox-caption">{item.caption}</Text>
								) : (
									item.caption
								))}
						</masonview>
						<masonview
							style={mergeStyle({ flexDirection: 'row', alignItems: 'center' }, { display: 'flex' })}
						>
							<Pressable
								className="vx-lightbox-nav"
								accessibilityLabel="Next"
								onPress={() => props.setIndex(Math.min(index + 1, count - 1))}
								disabled={index >= count - 1}
							>
								<Icon name="xplat-chevron-right" />
							</Pressable>
							<Pressable
								className="vx-lightbox-close"
								accessibilityLabel="Close"
								onPress={() => props.onClose()}
							>
								<Icon name="xplat-close" />
							</Pressable>
						</masonview>
					</masonview>
				</masonview>
			)}
		</masonview>
	</LayerDepthProvider>
}

/** Full-screen media viewer (Astryx `Lightbox`), GTK leaf — a modal,
 *  dimmed overlay layer above the root content (the in-window equivalent
 *  of the native `RootLayout` presentation), content portaled from the
 *  declaring tree. Swipe/arrow keys navigate, double-tap zooms images,
 *  scrim tap and Escape dismiss. `type:'video'` falls back to alt text —
 *  the video widget lives in the `@octane-xplat/video` leaf package. */
export function Lightbox(props: LightboxProps) @{
	const sentinel = useRef<any>(null)
	const [internal, setInternal] = useState(props.defaultIndex ?? 0)
	const [layer, setLayer] = useState<any>(null)
	const dismiss = useRef(props.onOpenChange)
	dismiss.current = props.onOpenChange
	const onIndexChange = useRef(props.onIndexChange)
	onIndexChange.current = props.onIndexChange

	const count = props.media.length
	const index = clampIndex(props.index ?? internal, count)

	const setIndex = (i: number) => {
		const clamped = clampIndex(i, count)
		if (props.index == null) {
			setInternal(clamped)
		}

		if (clamped !== index) {
			onIndexChange.current?.(clamped)
		}
	}

	// The layer key controller is bound once per layer; keep the latest
	// navigation state in a ref so Left/Right always step from the current
	// slide.
	const nav = useRef({ index, count, setIndex })
	nav.current = { index, count, setIndex }

	const open = props.isOpen && count > 0
	const dismissal = useLayerDismissal({
		active: !!open,
		isPresent: () => !!layer,
		dismiss: () => dismiss.current?.(false),
		behavior: 'close',
		getHost: () => sentinel.current,
		getFocusTarget: () => props.finalFocusRef?.current,
	})

	useEffect(() => {
		const view = sentinel.current
		if (!view || !open) {
			return
		}

		const l = view.createOverlayLayer({
			modal: true,
			scrim: true,
			align: { h: 'fill', v: 'fill' },
			onScrimPress: () => dismiss.current?.(false),
		})
		l.target.set_can_focus?.(true)
		// Left/Right page through media while the modal surface is up (macOS
		// presentation contract). A capture-phase controller on the window
		// sees every key regardless of which widget holds focus — the layer
		// target is a plain Gtk.Box that may not have focus yet when the
		// layer first maps. Escape is not claimed: it falls through to the
		// window's layer-dismissal sink.
		const root = view.get_root?.()
		const keys = new Gtk.EventControllerKey()
		keys.set_propagation_phase?.(Gtk.PropagationPhase.CAPTURE)
		keys.connect('key-pressed', (_c: any, keyval: number) => {
			const n = nav.current
			if (keyval === Gdk.KEY_Left) {
				n.setIndex(Math.max(n.index - 1, 0))
				return true
			}

			if (keyval === Gdk.KEY_Right) {
				n.setIndex(Math.min(n.index + 1, n.count - 1))
				return true
			}

			return false
		})
		root?.add_controller?.(keys)
		setLayer(l)
		l.setVisible(true)
		return () => {
			try {
				root?.remove_controller?.(keys)
			} catch { }
			l.dispose()
			setLayer(null)
		}
	}, [open])

	useEffect(() => () => layer?.dispose(), [])

	<>
		<masonview
			ref={(v: any) => {
				sentinel.current = v
			}}
			style={mergeStyle(
				{ flexDirection: 'column' },
				mergeStyle({ display: 'flex' }, { width: 0, height: 0 }),
			)}
		/>
		{open && layer
			? createPortal(
					<LightboxPanel
						media={props.media}
						index={index}
						setIndex={setIndex}
						onClose={() => dismiss.current(false)}
						hasZoom={props.hasZoom ?? true}
						layerDepth={dismissal.depth}
						className={props.className}
					/>,
					layer.target,
				)
			: null}
	</>
}
