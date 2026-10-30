export type ScrollableAreaMetrics = {
	maxX: number
	maxY: number
	x: number
	y: number
}

/** AppKit bounds/frame sizes are points. The clip origin uses the document's
 * coordinate system; an unflipped document counts its block offset from below. */
export function scrollableAreaMetrics(
	view: any,
	event?: { verticalOffset?: number; viewportHeight?: number; contentHeight?: number },
): ScrollableAreaMetrics {
	const clip = view?.contentView?.bounds
	const document = view?.documentView
	const size = document?.frame?.size
	const maxX = Math.max(0, Number(size?.width ?? 0) - Number(clip?.size?.width ?? 0))
	const maxY = Math.max(
		0,
		Number(size?.height ?? event?.contentHeight ?? 0) -
			Number(clip?.size?.height ?? event?.viewportHeight ?? 0),
	)

	const flipped = Boolean(document?.flipped)

	const y = Number(clip?.origin?.y ?? event?.verticalOffset ?? 0)
	return {
		maxX,
		maxY,
		x: Number(clip?.origin?.x ?? 0),
		y: document && !flipped ? maxY - y : y,
	}
}
