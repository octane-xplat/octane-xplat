/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle, styleRecord } from '../../internal/layout/style-merge'
import { useCallback, useEffect, useId, useRef, useState } from 'octane'
import { Popover } from './Popover'
import { cx } from '@octane-xplat/lib'
import type {
	ContextLayerReturn,
	ContextRenderProps,
	FixedLayerOptions,
	FixedLayerReturn,
	FixedRenderProps,
	LayerOptions,
} from '../../props'

// The Popover layout without its own anchored-position resolution — layer
// surfaces carry the useLayer placement/alignment through internal-props.
const LayerPopover = Popover as unknown as (props: any) => any

/** Anchored-layer primitive (Astryx `useLayer`), GTK leaf. The layer mounts
 *  through the renderer Popover session — the `anchorRef` ref-object prop is
 *  read inside `Popover` on every render, so the anchor binds whenever the
 *  consumer's `ref` callback fires. Context mode is anchor-relative; fixed
 *  mode anchors at x/y window points via the marker view's bounds. */
export function useLayer<O extends LayerOptions>(
	options: O,
): O extends FixedLayerOptions ? FixedLayerReturn : ContextLayerReturn @{
	const fixed = options.mode === 'fixed'
	const id = useId()
	const [isOpen, setIsOpen] = useState(false)
	const openRef = useRef(false)
	const anchorEl = useRef<any>(null)
	const markerEl = useRef<any>(null)
	const content = useRef<any>(null)
	const renderProps = useRef<ContextRenderProps | FixedRenderProps | undefined>(undefined)
	const onShow = useRef(options.onShow)
	onShow.current = options.onShow
	const onHide = useRef(options.onHide)
	onHide.current = options.onHide

	// Dismissal is owned by the mounted Popover (its own useLayerDismissal) —
	// a second registration here would make this layer non-topmost so
	// `shouldClose()` swallows the Escape/outside dismiss. The block/close
	// semantics pass through `dismissOnEscape`/`dismissOnOutsideTap` below.
	const controlled = options.isOpen !== undefined
	const visible = options.isOpen ?? isOpen
	const controlledOpen = useRef(options.isOpen)
	controlledOpen.current = options.isOpen

	const show = useCallback(() => {
		if (visible || openRef.current) { return }
		if (!controlled) {
			openRef.current = true
			setIsOpen(true)
		}
		onShow.current?.()
	}, [visible, controlled])

	const hide = useCallback(() => {
		if (!(controlledOpen.current ?? openRef.current)) { return }
		if (!controlled) {
			openRef.current = false
			setIsOpen(false)
		}
		onHide.current?.()
	}, [controlled])

	const ref = useCallback((el: any) => { anchorEl.current = el }, [])

	const render = useCallback(
		(children: any, props?: ContextRenderProps | FixedRenderProps) => {
			content.current = children
			renderProps.current = props
			const p = (props ?? {}) as ContextRenderProps
			return (
				<>
					{visible ? (
						<LayerPopover
							open={visible}
							anchor={fixed ? markerEl : anchorEl}
							fixedPosition={
								fixed
									? { x: (props as FixedRenderProps)?.x ?? 0, y: (props as FixedRenderProps)?.y ?? 0 }
									: undefined
							}
							layerPosition={
								fixed || p.positioning === 'custom'
									? undefined
									: { placement: p.placement, alignment: p.alignment }
							}
							placement={p.placement ?? 'bottom'}
							alignment={p.alignment ?? 'start'}
							offset={p.offset}
							onDismiss={() => hide()}
							className={cx('vx-popover', props?.className)}
							style={props?.style}
							dismissOnEscape={options.dismissOnEscape === true || (options.dismissOnEscape === undefined && options.lightDismiss === true)}
							dismissOnOutsideTap={options.lightDismiss === true}
						>
							{children}
						</LayerPopover>
					) : null}
					{fixed && (
						<masonview
							ref={(v: any) => { markerEl.current = v }}
							style={mergeStyle({ display: 'flex' }, { width: 1, height: 1 })}
						/>
					)}
				</>
			)
		},
		[fixed, visible, hide],
	)

	return (
		fixed
			? { ref: undefined, id, isOpen: visible, show, hide, render }
			: { ref, anchorId: id, id, isOpen: visible, show, hide, render }
	) as O extends FixedLayerOptions ? FixedLayerReturn : ContextLayerReturn
}
