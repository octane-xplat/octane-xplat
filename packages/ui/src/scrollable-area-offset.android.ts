/** Mason's TwoDScrollView accepts physical pixels; the public handle uses dips. */
export function scrollableAreaOffset(
	view: any,
	offset: { inline?: number; block?: number },
	animated = false,
): void {
	const native = view?.android
	if (!native) {
		return
	}
	const density = Number(native.getResources().getDisplayMetrics().density) || 1
	const inline = offset.inline != null && Number.isFinite(offset.inline)
	const block = offset.block != null && Number.isFinite(offset.block)
	if (!inline && !block) {
		return
	}
	const x = inline ? Math.round(Math.max(0, offset.inline!) * density) : native.getScrollX()
	const y = block ? Math.round(Math.max(0, offset.block!) * density) : native.getScrollY()
	if (animated) {
		native.smoothScrollTo(x, y)
	} else {
		native.scrollTo(x, y)
	}
}
