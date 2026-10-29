import type { ScrollAxis, ScrollAxisState, ScrollableAreaState } from '../../props'

// One layout unit (CSS px, dip, or AppKit point), never a backing pixel.
const EPS = 1
export const SCROLL_AT_EDGES: ScrollAxisState = { isScrollable: false, atStart: true, atEnd: true }
export const INITIAL_SCROLL_STATE: ScrollableAreaState = {
	inline: SCROLL_AT_EDGES,
	block: SCROLL_AT_EDGES,
}

export function scrollAxisState(
	allowed: boolean,
	maximum: number,
	offset: number,
): ScrollAxisState {
	const max = Number.isFinite(maximum) ? Math.max(0, maximum) : 0
	if (!allowed || max <= EPS) {
		return SCROLL_AT_EDGES
	}

	const position = Number.isFinite(offset) ? Math.min(max, Math.max(0, offset)) : 0
	return { isScrollable: true, atStart: position <= EPS, atEnd: position >= max - EPS }
}

export function scrollableAreaState(
	axis: ScrollAxis,
	maxX: number,
	x: number,
	maxY: number,
	y: number,
): ScrollableAreaState {
	return {
		inline: scrollAxisState(axis !== 'block', maxX, x),
		block: scrollAxisState(axis !== 'inline', maxY, y),
	}
}

export function sameScrollState(a: ScrollableAreaState, b: ScrollableAreaState): boolean {
	return (
		a.inline.isScrollable === b.inline.isScrollable &&
		a.inline.atStart === b.inline.atStart &&
		a.inline.atEnd === b.inline.atEnd &&
		a.block.isScrollable === b.block.isScrollable &&
		a.block.atStart === b.block.atStart &&
		a.block.atEnd === b.block.atEnd
	)
}
