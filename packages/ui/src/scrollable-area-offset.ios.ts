/** Mason Scroll exposes a native bounds-based viewport, not NS ScrollView.
 * Its contentOffset setter clamps both axes. No animated setter is provided. */
export function scrollableAreaOffset(
	view: any,
	offset: { inline?: number; block?: number },
	_animated = false,
): void {
	const native = view?.ios
	if (!native) {
		return
	}
	const current = native.contentOffset
	const inline = offset.inline != null && Number.isFinite(offset.inline)
	const block = offset.block != null && Number.isFinite(offset.block)
	if (!inline && !block) {
		return
	}
	native.contentOffset = {
		x: inline ? Math.max(0, offset.inline!) : Number(current?.x ?? 0),
		y: block ? Math.max(0, offset.block!) : Number(current?.y ?? 0),
	}
}
