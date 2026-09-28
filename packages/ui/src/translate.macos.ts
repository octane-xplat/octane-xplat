export function setTranslate(view: any, x = 0, y = 0): void {
	if (!view) {return}
	view.translateX = x
	view.translateY = y
}
