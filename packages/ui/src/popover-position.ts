import type { LayerPlacement, PopoverAlignment, PopoverPlacement } from './props'

export interface PopoverRect {
	left: number
	top: number
	width: number
	height: number
}

export interface PopoverPosition {
	left: number
	top: number
	placement: PopoverPlacement
}

const opposite: Record<PopoverPlacement, PopoverPlacement> = {
	top: 'bottom',
	bottom: 'top',
	left: 'right',
	right: 'left',
}

/** Place beside the anchor, flip once when the requested side overflows,
 *  then clamp. `alignment` positions along the cross axis — 'start' keeps
 *  the panel's start edge flush with the anchor's (the historical
 *  behavior), 'center' centers, 'end' aligns the end edges. */
export function positionPopover(
	anchor: PopoverRect,
	panel: Pick<PopoverRect, 'width' | 'height'>,
	viewport: PopoverRect,
	requested: PopoverPlacement = 'bottom',
	gap = 8,
	alignment: PopoverAlignment = 'start',
): PopoverPosition {
	const align = (placement: PopoverPlacement) => {
		if (placement === 'top' || placement === 'bottom') {
			return alignment === 'center'
				? anchor.left + (anchor.width - panel.width) / 2
				: alignment === 'end'
					? anchor.left + anchor.width - panel.width
					: anchor.left
		}

		return alignment === 'center'
			? anchor.top + (anchor.height - panel.height) / 2
			: alignment === 'end'
				? anchor.top + anchor.height - panel.height
				: anchor.top
	}

	const at = (placement: PopoverPlacement): { left: number; top: number } => {
		switch (placement) {
			case 'top':
				return { left: align(placement), top: anchor.top - panel.height - gap }
			case 'bottom':
				return { left: align(placement), top: anchor.top + anchor.height + gap }
			case 'left':
				return { left: anchor.left - panel.width - gap, top: align(placement) }
			case 'right':
				return { left: anchor.left + anchor.width + gap, top: align(placement) }
		}

		throw new Error(`Unknown popover placement: ${placement}`)
	}

	const fits = (position: { left: number; top: number }) =>
		position.left >= viewport.left &&
		position.top >= viewport.top &&
		position.left + panel.width <= viewport.left + viewport.width &&
		position.top + panel.height <= viewport.top + viewport.height

	const preferred = at(requested)
	const placement = fits(preferred) ? requested : opposite[requested]
	const raw = placement === requested ? preferred : at(placement)
	const maxLeft = Math.max(viewport.left, viewport.left + viewport.width - panel.width)
	const maxTop = Math.max(viewport.top, viewport.top + viewport.height - panel.height)
	return {
		left: Math.min(maxLeft, Math.max(viewport.left, raw.left)),
		top: Math.min(maxTop, Math.max(viewport.top, raw.top)),
		placement,
	}
}

/** Resolve a `useLayer` placement — logical (`above`/`below`/`start`/`end`)
 *  or physical — to a physical side for `positionPopover`. `rtl` mirrors the
 *  logical inline sides. */
export function resolveLayerSide(
	placement: LayerPlacement | PopoverPlacement | undefined,
	rtl = false,
): PopoverPlacement {
	switch (placement) {
		case 'below':
		case 'bottom':
			return 'bottom'
		case 'start':
			return rtl ? 'right' : 'left'
		case 'end':
			return rtl ? 'left' : 'right'
		case 'left':
		case 'right':
			return placement
		default:
			return 'top'
	}
}

/** Normalize a `useLayer` render-prop offset to a dip clearance. A number is
 *  taken as-is; native accepts numeric or px strings and rejects other CSS units. Defaults to flush (0). */
export function layerOffset(offset: number | string | undefined): number {
	if (offset == null) {
		return 0
	}

	if (typeof offset === 'string' && !/^\s*[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:px)?\s*$/.test(offset)) {
		throw new TypeError('Native layer offset requires a number or px length')
	}

	const value = typeof offset === 'number' ? offset : parseFloat(offset)
	return Number.isFinite(value) ? Math.max(0, value) : 0
}

/** Horizontal cross-axis alignment follows the anchor's inline direction. */
export function resolveLayerAlignment(
	alignment: PopoverAlignment = 'center',
	side: PopoverPlacement,
	rtl = false,
): PopoverAlignment {
	return rtl && (side === 'top' || side === 'bottom') && alignment !== 'center'
		? alignment === 'start'
			? 'end'
			: 'start'
		: alignment
}

/** Read the effective OS direction, with inherited author direction as a fallback. */
export function nativeLayerRTL(view: any): boolean {
	if (typeof view?.android?.getLayoutDirection === 'function') {
		return view.android.getLayoutDirection() === 1
	}

	if (view?.ios?.effectiveUserInterfaceLayoutDirection != null) {
		return view.ios.effectiveUserInterfaceLayoutDirection === 1
	}

	if (view?.userInterfaceLayoutDirection != null) {
		return view.userInterfaceLayoutDirection === 1
	}

	for (let current = view; current; current = current.parent ?? current.superview) {
		const direction = current.direction ?? current.style?.direction
		if (direction === 'rtl' || direction === 'ltr') {
			return direction === 'rtl'
		}
	}

	return false
}
