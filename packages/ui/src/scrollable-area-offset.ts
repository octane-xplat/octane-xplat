/** NativeScript scroll shells outside the Mason platform leaves. */
export function scrollableAreaOffset(
	view: any,
	offset: { inline?: number; block?: number },
	animated = false,
): void {
	if (offset.block != null && Number.isFinite(offset.block)) {
		view?.scrollToVerticalOffset?.(Math.max(0, offset.block), animated)
	}
	if (offset.inline != null && Number.isFinite(offset.inline)) {
		view?.scrollToHorizontalOffset?.(Math.max(0, offset.inline), animated)
	}
}
