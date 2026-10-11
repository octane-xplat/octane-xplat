import type { HostAdapter } from './host-types'
import type { Target } from './types'
import { attachPan } from './pan.macos'

// AppKit refs are NSViews, not NativeScript Views. Keep public y-down units
// and degrees at this boundary; explicit JS samples own interpolation.
export function attachHost(node: any): HostAdapter {
	const layer = node.layer
	const read = (path: string, fallback: number) => Number(layer?.valueForKeyPath(path) ?? fallback)
	const original = {
		opacity: Number(node.alphaValue ?? 1),
		x: read('transform.translation.x', 0),
		y: -read('transform.translation.y', 0),
		scale: 1,
		scaleX: read('transform.scale.x', 1),
		scaleY: read('transform.scale.y', 1),
		rotate: (read('transform.rotation.z', 0) * 180) / Math.PI,
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

	const write = (values: Target) => {
		const transforms: [string, number][] = []
		if (values.x !== undefined) {
			transforms.push(['transform.translation.x', values.x])
		}

		if (values.y !== undefined) {
			transforms.push(['transform.translation.y', -values.y])
		}

		if (values.rotate !== undefined) {
			transforms.push(['transform.rotation.z', (values.rotate * Math.PI) / 180])
		}

		if (values.scale !== undefined || values.scaleX !== undefined) {
			transforms.push(['transform.scale.x', (values.scale ?? 1) * (values.scaleX ?? 1)])
		}

		if (values.scale !== undefined || values.scaleY !== undefined) {
			transforms.push(['transform.scale.y', (values.scale ?? 1) * (values.scaleY ?? 1)])
		}

		if (values.opacity === undefined && !transforms.length) {
			return
		}

		const transaction = (globalThis as any).CATransaction
		transaction.begin()
		try {
			transaction.setDisableActions(true)
			if (values.opacity !== undefined) {
				node.alphaValue = Math.min(1, Math.max(0, values.opacity))
			}

			if (transforms.length) {
				node.wantsLayer = true
				for (const [path, value] of transforms) {
					node.layer.setValueForKeyPath(value, path)
				}
			}
		} finally {
			transaction.commit()
		}
	}

	return {
		read: () => ({ ...original }),
		write,
		restore: () => write(original),
		pan: (axis, callbacks) => attachPan(node, axis, callbacks),
	}
}
