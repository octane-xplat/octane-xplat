import type { PopoverAlignment, PopoverPlacement } from './props'

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
				: alignment === 'end' ? anchor.left + anchor.width - panel.width : anchor.left
		}

		return alignment === 'center'
			? anchor.top + (anchor.height - panel.height) / 2
			: alignment === 'end' ? anchor.top + anchor.height - panel.height : anchor.top
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
