export function geometry(view: any) {
	const native = view.nativeView
	const density = native.getResources().getDisplayMetrics().density
	const location = (Array as any).create('int', 2)
	native.getLocationInWindow(location)
	let scale = 1
	for (let current = native; current?.getScaleX; current = current.getParent()) {
		scale *= current.getScaleX()
	}
	return {
		x: location[0] / density,
		y: location[1] / density,
		width: (native.getWidth() * scale) / density,
		layoutX: native.getLeft() / density,
		modelWidth: native.getWidth() / density,
	}
}
