import { Rectangle } from '@dnd-kit/geometry'

/** NativeScript screen coordinates and dimensions are in DIPs. */
export function measure(element: any): Rectangle | null {
	if (!element || element.isLoaded === false) {
		return null
	}

	const point = element.getLocationOnScreen?.()
	const size = element.getActualSize?.()
	return point && size && size.width > 0 && size.height > 0
		? new Rectangle(point.x, point.y, size.width, size.height)
		: null
}

export function dragStyle(x: number, y: number): Record<string, number | string> {
	return { translateX: x, translateY: y, zIndex: x || y ? 1 : 0 }
}
