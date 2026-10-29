/** MasonKit elements expose browser scrolling in CSS px on iOS, Android and Windows. */
export function masonScrollableAreaOffset(
	view: any,
	offset: { inline?: number; block?: number },
	animated = false,
): void {
	const options: { left?: number; top?: number } = {}
	if (offset.inline != null && Number.isFinite(offset.inline)) {
		options.left = Math.max(0, offset.inline)
	}
	if (offset.block != null && Number.isFinite(offset.block)) {
		options.top = Math.max(0, offset.block)
	}
	if (options.left === undefined && options.top === undefined) {
		return
	}
	view?.scrollTo?.({ ...options, behavior: animated ? 'smooth' : 'instant' })
}
