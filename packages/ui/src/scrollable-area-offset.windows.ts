/** Mason's nativeViewProtected is its outer WinUI ScrollViewer; windows is
 * the inner Mason content view. ChangeView uses device-independent pixels. */
export function scrollableAreaOffset(
	view: any,
	offset: { inline?: number; block?: number },
	animated = false,
): void {
	const native = view?.nativeViewProtected
	if (!native || typeof native.ChangeView !== 'function') {
		return
	}
	const clamp = (value: number, limit: unknown) =>
		Math.min(Math.max(0, value), Math.max(0, Number(limit) || 0))
	const x =
		offset.inline != null && Number.isFinite(offset.inline)
			? clamp(offset.inline, native.ScrollableWidth)
			: null
	const y =
		offset.block != null && Number.isFinite(offset.block)
			? clamp(offset.block, native.ScrollableHeight)
			: null
	if (x === null && y === null) {
		return
	}
	native.ChangeView(x, y, null, !animated)
}
