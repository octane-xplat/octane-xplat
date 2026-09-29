import type { HostAdapter } from './host-types'
export function attachHost(node: HTMLElement): HostAdapter {
	const transform = node.style.transform
	const opacity = node.style.opacity
	const computed = getComputedStyle(node)
	if (computed.transform && computed.transform !== 'none') {
		throw new Error('motion: put existing CSS transforms on an outer container')
	}

	return {
		read: () => ({
			opacity: Number(computed.opacity || 1),
			x: 0,
			y: 0,
			scale: 1,
			scaleX: 1,
			scaleY: 1,
			rotate: 0,
		}),
		write(values) {
			if (values.opacity !== undefined) {
				node.style.opacity = String(Math.min(1, Math.max(0, values.opacity)))
			}

			if (Object.keys(values).some((key) => key !== 'opacity')) {
				node.style.transform = `translateX(${values.x ?? 0}px) translateY(${values.y ?? 0}px) scale(${values.scale ?? 1}) scaleX(${values.scaleX ?? 1}) scaleY(${values.scaleY ?? 1}) rotate(${values.rotate ?? 0}deg)`
			}
		},
		restore() {
			node.style.transform = transform
			node.style.opacity = opacity
		},
	}
}
