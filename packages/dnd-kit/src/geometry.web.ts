import { Rectangle } from '@dnd-kit/geometry'

export function measure(element: any): Rectangle | null {
	if (!element?.isConnected) {
		return null
	}

	const rect = element.getBoundingClientRect()
	return rect.width > 0 && rect.height > 0 ? Rectangle.from(rect) : null
}

export function dragStyle(x: number, y: number): Record<string, number | string> {
	return { transform: `translate(${x}px, ${y}px)`, touchAction: 'none', zIndex: x || y ? 1 : 0 }
}
