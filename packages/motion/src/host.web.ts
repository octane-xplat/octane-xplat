import { attachPan } from './pan.web'
import { delegatedRun } from './driver.web'
import type { DelegatedRequest, DelegatedRun, HostAdapter } from './host-types'
import type { Target } from './types'
export function attachHost(node: HTMLElement): HostAdapter {
	const transform = node.style.transform
	const opacity = node.style.opacity
	const computed = getComputedStyle(node)
	if (computed.transform && computed.transform !== 'none') {
		throw new Error('motion: put existing CSS transforms on an outer container')
	}

	const write = (values: Target) => {
		if (values.opacity !== undefined) {
			node.style.opacity = String(Math.min(1, Math.max(0, values.opacity)))
		}

		if (Object.keys(values).some((key) => key !== 'opacity')) {
			node.style.transform = `translateX(${values.x ?? 0}px) translateY(${values.y ?? 0}px) scale(${values.scale ?? 1}) scaleX(${values.scaleX ?? 1}) scaleY(${values.scaleY ?? 1}) rotate(${values.rotate ?? 0}deg)`
		}
	}

	return {
		pan: (axis, callbacks) => attachPan(node, axis, callbacks),
		read: () => ({
			opacity: Number(computed.opacity || 1),
			x: 0,
			y: 0,
			scale: 1,
			scaleX: 1,
			scaleY: 1,
			rotate: 0,
		}),
		write,
		delegate: (req: DelegatedRequest): DelegatedRun | null => delegatedRun(node, req, write),
		restore() {
			node.style.transform = transform
			node.style.opacity = opacity
		},
		gesture(kind, callbacks) {
			if (kind === 'press') {
				const down = (event: PointerEvent) => {
					try {
						// Preserve descendant click targets when this host wraps controls.
						;(event.target as Element | null)?.setPointerCapture?.(event.pointerId)
					} catch (error) {
						// Synthetic pointer dispatch has no active browser pointer.
						if (event.isTrusted || (error as Error).name !== 'NotFoundError') {
							throw error
						}
					}

					callbacks.start()
				}

				const end = () => callbacks.end()
				node.addEventListener('pointerdown', down)
				node.addEventListener('pointerup', end)
				node.addEventListener('pointercancel', end)
				return () => {
					node.removeEventListener('pointerdown', down)
					node.removeEventListener('pointerup', end)
					node.removeEventListener('pointercancel', end)
				}
			}

			node.addEventListener('focus', callbacks.start)
			node.addEventListener('blur', callbacks.end)
			return () => {
				node.removeEventListener('focus', callbacks.start)
				node.removeEventListener('blur', callbacks.end)
			}
		},
	}
}
