export function geometry(view: any) {
	const native = view.nativeViewProtected ?? view.nativeView
	const rect = native.convertRectToView(native.bounds, null)
	return {
		x: Number(rect.origin.x),
		y: Number(rect.origin.y),
		width: Number(rect.size.width),
		layoutX: Number(native.center.x - native.bounds.size.width / 2),
		modelWidth: Number(native.bounds.size.width),
	}
}
