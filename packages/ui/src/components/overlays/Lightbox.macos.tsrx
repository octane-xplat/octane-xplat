/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle } from '../../internal/layout/style-merge'
import { useEffect, useMemo, useRef, useState } from 'octane'
import { createAppKitLightboxGestures } from './lightbox-gestures.macos'
import type { LightboxProps } from '../../props'
import { cx } from '@octane-xplat/lib'
import { Button } from '../actions/controls.macos.tsrx'
import { LayerDepthProvider, useLayerDismissal } from './layer-dismissal.tsrx'
import { usePresentation } from './presentation.macos.tsrx'

function LightboxPanel(
	props: LightboxProps & {
		dark?: boolean
		layerDepth: number
		currentIndex: number
		setIndex: (i: number) => void
	},
) @{
	const item = props.media[props.currentIndex]
	const latest = useRef(props),
		stage = useRef<any>(null),
		viewport = useRef<any>(null)

	latest.current = props
	const gestures = useMemo(
		() =>
			createAppKitLightboxGestures({
				stage: () => stage.current,
				viewport: () => viewport.current,
				state() {
					const p = latest.current,
						media = p.media[p.currentIndex]

					return {
						open: p.isOpen,
						index: p.currentIndex,
						count: p.media.length,
						src: media?.src,
						image: !!media && media.type !== 'video',
						zoom: p.hasZoom !== false,
					}
				},
				select: (index) => latest.current.setIndex(index),
			}),
		[],
	)

	useEffect(() => {
		gestures.sync()
	})

	useEffect(() => () => gestures.dispose(), [])

	<LayerDepthProvider value={props.layerDepth}>
		<masonview
			id={props.id}
			className={cx('vx-lightbox', props.dark && 'ns-dark', props.className)}
			style={mergeStyle({ flexDirection: 'column' }, mergeStyle({ display: 'flex' }, props.style))}
		>
			<masonview
				style={mergeStyle({ flexDirection: 'row', alignItems: 'center' }, { display: 'flex' })}
			>
				<Button
					accessibilityLabel="Previous media"
					isDisabled={props.currentIndex === 0}
					clickAction={() => props.setIndex(props.currentIndex - 1)}
				>
					Previous
				</Button>
				<label className="vx-lightbox-counter">{`${props.currentIndex + 1} of ${props.media.length}`}</label>
				<Button
					accessibilityLabel="Next media"
					isDisabled={props.currentIndex === props.media.length - 1}
					clickAction={() => props.setIndex(props.currentIndex + 1)}
				>
					Next
				</Button>
				<Button accessibilityLabel="Close lightbox" clickAction={() => props.onOpenChange(false)}>
					×
				</Button>
			</masonview>
			<masonview
				ref={stage}
				className="vx-lightbox-stage"
				style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, minHeight: 0 }}
				onDoubleTap={
					item && item.type !== 'video' && props.hasZoom !== false
						? () => gestures.toggleZoom()
						: undefined
				}
				onSwipe={props.media.length > 1 ? (event) => gestures.swipe(event.direction) : undefined}
			>
				{item?.type === 'video' ? (
					<xplatvideo
						className="vx-lightbox-media"
						src={item?.src}
						controls={true}
						autoplay={props.hasAutoPlay ?? false}
						accessibilityLabel={item?.alt}
					/>
				) : (
					<scrollview
						ref={viewport}
						className="vx-lightbox-scroll"
						style={{ flexGrow: 1, minHeight: 0 }}
					>
						<image src={item?.src} accessibilityLabel={item?.alt} />
					</scrollview>
				)}
			</masonview>
			{item?.caption != null && <label whiteSpace="normal">{item.caption}</label>}
		</masonview>
	</LayerDepthProvider>
}

export function Lightbox(props: LightboxProps) @{
	const [internal, setInternal] = useState(props.defaultIndex ?? 0)
	const count = props.media.length
	const index = Math.min(Math.max(props.index ?? internal, 0), Math.max(0, count - 1))
	const setIndex = (value: number) => {
		const next = Math.min(Math.max(value, 0), Math.max(0, count - 1))
		if (props.index == null) {
			setInternal(next)
		}

		if (next !== index) {
			props.onIndexChange?.(next)
		}
	}

	const dismissal = useLayerDismissal({
		get active() {
			return props.isOpen && count > 0
		},
		dismiss: () => props.onOpenChange(false),
		behavior: 'close',
		getFocusTarget: () => props.finalFocusRef?.current,
		restoreFocus: false,
	})

	const owner = usePresentation(
		props.isOpen && count > 0,
		LightboxPanel,
		{ ...props, layerDepth: dismissal.depth, currentIndex: index, setIndex },
		{
			kind: 'lightbox',
			modal: true,
			label: props.media[index]?.alt ?? 'Media viewer',
			zoom: props.hasZoom ?? true,
			finalFocusRef: props.finalFocusRef,
			canDismiss: () => dismissal.shouldClose(),
			onDismiss: () => props.onOpenChange(false),
			onKey: (key: number) => {
				if (key === 123) {
					setIndex(index - 1)
					return true
				}

				if (key === 124) {
					setIndex(index + 1)
					return true
				}

				return false
			},
		},
	)

	<>{owner}</>
}
