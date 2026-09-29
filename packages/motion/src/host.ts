import type { HostAdapter } from './host-types'
// The retained NativeScript View exposes direct transform channels in DIP.
export function attachHost(node: any): HostAdapter {
	const original = {
		opacity: node.opacity ?? 1,
		x: node.translateX ?? 0,
		y: node.translateY ?? 0,
		scaleX: node.scaleX ?? 1,
		scaleY: node.scaleY ?? 1,
		rotate: node.rotate ?? 0,
	}

	if (
		original.x ||
		original.y ||
		original.rotate ||
		original.scaleX !== 1 ||
		original.scaleY !== 1
	) {
		throw new Error('motion: put existing transforms on an outer container')
	}

	const write = (values: any) => {
		if (values.opacity !== undefined) {
			node.opacity = values.opacity
		}

		if (values.x !== undefined) {
			node.translateX = values.x
		}

		if (values.y !== undefined) {
			node.translateY = values.y
		}

		if (values.rotate !== undefined) {
			node.rotate = values.rotate
		}

		if (values.scale !== undefined || values.scaleX !== undefined) {
			node.scaleX = (values.scale ?? 1) * (values.scaleX ?? 1)
		}

		if (values.scale !== undefined || values.scaleY !== undefined) {
			node.scaleY = (values.scale ?? 1) * (values.scaleY ?? 1)
		}
	}

	return { read: () => ({ ...original, scale: 1 }), write, restore: () => write(original) }
}
