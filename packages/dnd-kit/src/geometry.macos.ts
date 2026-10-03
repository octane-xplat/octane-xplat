import { Rectangle } from '@dnd-kit/geometry'

/** AppKit points in top-left window-content coordinates, independent of parent and scroll offsets. */
export function measure(view: any): Rectangle | null {
	const content = view?.window?.contentView
	if (!content || !view?.convertRectToView) {
		return null
	}

	const frame = view.convertRectToView(view.bounds, content)
	if (frame.size.width <= 0 || frame.size.height <= 0) {
		return null
	}

	const bounds = content.bounds
	const flipped = typeof content.isFlipped === 'function' ? content.isFlipped() : content.isFlipped
	const x = Number(frame.origin.x) - Number(bounds.origin.x)
	const y = flipped
		? Number(frame.origin.y) - Number(bounds.origin.y)
		: Number(bounds.origin.y) +
			Number(bounds.size.height) -
			Number(frame.origin.y) -
			Number(frame.size.height)

	return frame.size.width > 0 && frame.size.height > 0
		? new Rectangle(x, y, Number(frame.size.width), Number(frame.size.height))
		: null
}

export function dragStyle(x: number, y: number): Record<string, number | string> {
	return { translateX: x, translateY: y, zIndex: x || y ? 1 : 0 }
}
