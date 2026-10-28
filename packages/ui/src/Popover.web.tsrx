import { modalPortalOwner } from './modal-focus.web'
import { LayerDepthProvider, useLayerDismissal } from './layer-dismissal.tsrx'
import { styleRecord } from './style-merge'
import { SizeProvider } from './size-context'
import { createPortal, useEffect, useRef, useState } from 'octane'
import { useThemeScheme } from './theme/theme-scheme'
import type { PopoverProps } from './props'
import type { PopoverInternalProps } from './internal-props'
import { cx } from '@octane-xplat/lib'
import { resolveCSSLayerOffset } from './layer-position.web'
import { positionPopover, resolveLayerAlignment, resolveLayerSide } from './popover-position'

type Position = { left: number; top: number; anchorWidth: number }

function PopoverLayer(props: PopoverInternalProps & { anchorElement: any }) @{
	const dark = useThemeScheme() === 'dark'
	const panelRef = useRef<any>(null)
	const focusedInside = useRef(false)
	const owner = modalPortalOwner(props.anchorElement)
	const dismissal = useLayerDismissal({
		minimumDepth: owner.depth,
		get active() {
			return !!props.open
		},
		getFocusTarget: () =>
			focusedInside.current ? (props.finalFocusRef?.current ?? props.anchorElement) : undefined,
		dismiss: () => props.onDismiss?.(),
		get behavior() {
			return props.dismissOnEscape === false ? 'block' : 'close'
		},
		contains: (target) => !!panelRef.current?.contains(target),
	})

	const [position, setPosition] = useState<Position | null>(null)
	const update = () => {
		const anchor = props.anchorElement
		if (!anchor?.getBoundingClientRect) {
			return
		}

		const anchorRect = anchor.getBoundingClientRect()
		const panelRect = panelRef.current?.getBoundingClientRect?.()
		const rtl = getComputedStyle(anchor).direction === 'rtl'
		const side = props.layerPosition
			? resolveLayerSide(props.layerPosition.placement, rtl)
			: (props.placement ?? 'bottom')

		const placed = positionPopover(
			{
				left: anchorRect.left,
				top: anchorRect.top,
				width: anchorRect.width,
				height: anchorRect.height,
			},
			{ width: panelRect?.width ?? 0, height: panelRect?.height ?? 0 },
			{ left: 0, top: 0, width: window.innerWidth, height: window.innerHeight },
			side,
			resolveCSSLayerOffset(props.offset ?? 8, anchor),
			props.layerPosition
				? resolveLayerAlignment(props.layerPosition.alignment, side, rtl)
				: (props.alignment ?? 'start'),
		)

		setPosition((current) =>
			current?.left === placed.left &&
			current?.top === placed.top &&
			current?.anchorWidth === anchorRect.width
				? current
				: { ...placed, anchorWidth: anchorRect.width },
		)
	}

	useEffect(() => {
		if (!props.open || !props.anchorElement?.getBoundingClientRect) {
			setPosition(null)
			return
		}

		update()
		window.addEventListener('resize', update)
		window.addEventListener('scroll', update, true)
		const observer =
			typeof ResizeObserver === 'undefined' || !panelRef.current ? null : new ResizeObserver(update)

		if (observer && panelRef.current) {
			observer.observe(panelRef.current)
		}

		if (observer) {
			observer.observe(props.anchorElement)
		}

		const writingContext =
			typeof MutationObserver === 'undefined' ? null : new MutationObserver(update)

		for (let element = props.anchorElement; element; element = element.parentElement) {
			writingContext?.observe(element, {
				attributes: true,
				attributeFilter: ['style', 'class', 'dir'],
			})
		}

		return () => {
			window.removeEventListener('resize', update)
			window.removeEventListener('scroll', update, true)
			observer?.disconnect()
			writingContext?.disconnect()
		}
	}, [
		props.layerPosition,
		props.open,
		props.anchorElement,
		props.placement,
		props.offset,
		props.alignment,
		props.children,
		position === null,
	])

	// `anchorMinWidth` floors the panel at the trigger's measured width (the
	// web stand-in for upstream `min(anchor-size(width), …)`); an explicit
	// style min-width/inline-size wins.
	const panelStyle = () => {
		const style = { ...styleRecord(props.style) }
		if (props.anchorMinWidth && position && style.minWidth == null && style.inlineSize == null) {
			style.minWidth = `min(${position.anchorWidth}px, calc(100vw - 32px))`
		}

		return style
	}

	const stopPointer = (event: PointerEvent) => event.stopPropagation()
	const dismiss = (event: MouseEvent) => {
		event.preventDefault()
		event.stopPropagation()
		if (dismissal.shouldClose()) {
			props.onDismiss?.()
		}
	}

	@if (props.open && position) {
		<>
			{createPortal(
				<div
					className={cx('vx-popover-layer', dark && 'dark')}
					style={{ position: 'fixed', inset: 0, zIndex: 1000, pointerEvents: 'none' }}
				>
					{(props.dismissOnOutsideTap ?? true) && (
						<div
							className="vx-popover-backdrop"
							style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'auto' }}
							onPointerDown={stopPointer}
							onClick={dismiss}
						/>
					)}
					<div
						ref={panelRef}
						className={cx('vx-popover', props.className)}
						style={{
							...panelStyle(),
							position: 'fixed',
							top: position.top,
							left: position.left,
							zIndex: 1,
							pointerEvents: 'auto',
						}}
						{...{
							...props.web,
							onFocusIn: (event: FocusEvent) => {
								focusedInside.current = true
								{
									const r = props.web?.onFocusIn
									if (typeof r === 'function') {
										r(event)
									}
								}
							},
						}}
					>
						<LayerDepthProvider value={dismissal.depth}>
							<SizeProvider value={null}>{props.children}</SizeProvider>
						</LayerDepthProvider>
					</div>
				</div>,
				owner.target,
			)}
		</>
	}
}

/** Positions a portal within its anchor's modal owner and dismisses on outside taps. */
export function Popover(props: PopoverProps) @{
	const [anchorElement, setAnchorElement] = useState<any>(null)
	const [internal, setInternal] = useState(props.defaultOpen ?? false)
	const open = props.open ?? internal
	const requestDismiss = () => {
		if (props.open === undefined) {
			setInternal(false)
		}

		props.onDismiss?.()
	}

	useEffect(() => {
		const next = props.anchor?.current ?? null
		if (next !== anchorElement) {
			setAnchorElement(next)
		}
	}, [props.anchor, props.anchor?.current, open, anchorElement])

	@if (open && anchorElement) {
		<PopoverLayer
			{...props}
			open={open}
			onDismiss={requestDismiss}
			anchorElement={anchorElement}
		/>
	}
}
