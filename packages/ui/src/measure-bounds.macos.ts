import type { MeasureBounds } from './props'

/** Convert every view into top-left window-content coordinates, in AppKit points. */
export function readBounds(view: any): MeasureBounds | null {
	const content = view?.window?.contentView
	if (!content || !view?.convertRectToView) {
		return null
	}

	const frame = view.convertRectToView(view.bounds, content)
	const bounds = content.bounds
	const flipped = typeof content.isFlipped === 'function' ? content.isFlipped() : content.isFlipped
	return {
		x: Number(frame.origin.x) - Number(bounds.origin.x),
		y: flipped
			? Number(frame.origin.y) - Number(bounds.origin.y)
			: Number(bounds.origin.y) +
				Number(bounds.size.height) -
				Number(frame.origin.y) -
				Number(frame.size.height),
		width: Number(frame.size.width),
		height: Number(frame.size.height),
	}
}
