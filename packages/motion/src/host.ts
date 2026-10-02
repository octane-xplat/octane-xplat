import type { DelegatedRequest, DelegatedRun, HostAdapter } from './host-types'
import { attachPan } from './pan'
import { delegatedRun } from './driver'
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
			node.opacity = Math.min(1, Math.max(0, values.opacity))
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

	return {
		pan: (axis, callbacks) => attachPan(node, axis, callbacks),
		read: () => ({ ...original, scale: 1 }),
		write,
		restore: () => write(original),
		delegate: (req: DelegatedRequest): DelegatedRun | null => delegatedRun(node, req, write),
		gesture(kind, callbacks) {
			if (typeof node.on !== 'function' || typeof node.off !== 'function') {
				return null
			}

			if (kind === 'press') {
				// NativeScript's `touch` event: action down/up/cancel.
				const onTouch = (event: any) => {
					if (event.action === 'down') {
						callbacks.start()
					} else if (event.action === 'up' || event.action === 'cancel') {
						callbacks.end()
					}
				}

				node.on('touch', onTouch)
				return () => node.off('touch', onTouch)
			}

			// focus/blur exist only on focusable hosts (editable text, buttons).
			const onFocus = () => callbacks.start()
			const onBlur = () => callbacks.end()
			node.on('focus', onFocus)
			node.on('blur', onBlur)
			return () => {
				node.off('focus', onFocus)
				node.off('blur', onBlur)
			}
		},
	}
}
