import { captureViewportOffset } from './projection/viewport-offset.web'
import { radiusKeys } from './projection/paint'
import { attachPan } from './pan.web'
import { delegatedRun } from './driver.web'
import {
	buildProjectionTransform,
	removeBoxTransforms,
	correctBorderRadius,
	correctBoxShadow,
} from 'motion-dom'

import type { DelegatedRequest, DelegatedRun, HostAdapter } from './host-types'
import type { Box, Measurement, ProjectionWrite } from './projection/types'
import type { Target } from './types'

/** Every element a motion host has attached to; lets the mutation filter
 *  recognize our own style writes. */
export const motionHostElements: WeakSet<Element> = new WeakSet<Element>()

export function attachHost(node: HTMLElement): HostAdapter {
	const transform = node.style.transform
	const transformOrigin = node.style.transformOrigin
	const opacity = node.style.opacity
	const computed = getComputedStyle(node)
	if (computed.transform && computed.transform !== 'none') {
		throw new Error('motion: put existing CSS transforms on an outer container')
	}

	motionHostElements.add(node)

	let latestValues: Target = {}
	let projecting = false
	const paintKeys = [...radiusKeys, 'boxShadow'] as const
	let paintSaved: Record<string, string> | undefined
	let paintApplied: Record<string, string> = {}
	const restorePaint = () => {
		if (!paintSaved) {
			return
		}
		for (const key of paintKeys) {
			if (node.style[key] === paintApplied[key]) {
				node.style[key] = paintSaved[key]
			}
		}
		paintSaved = undefined
	}
	const correctPaint = (projection: ProjectionWrite) => {
		restorePaint()
		paintSaved = Object.fromEntries(paintKeys.map((key) => [key, node.style[key]]))
		const baseline = getComputedStyle(node)
		const values = Object.fromEntries(paintKeys.map((key) => [key, baseline[key]]))
		const context = {
			target: projection.target,
			treeScale: projection.treeScale,
			projectionDelta: projection.layoutDelta ?? projection.delta,
		}
		for (const key of radiusKeys) {
			node.style[key] = String(correctBorderRadius.correct(values[key], context as any))
		}
		if (values.boxShadow && values.boxShadow !== 'none') {
			node.style.boxShadow = String(correctBoxShadow.correct(values.boxShadow, context as any))
		}
		paintApplied = Object.fromEntries(paintKeys.map((key) => [key, node.style[key]]))
	}

	const write = (values: Target) => {
		latestValues = { ...latestValues, ...values }
		if (values.opacity !== undefined) {
			node.style.opacity = String(Math.min(1, Math.max(0, values.opacity)))
		}

		if (Object.keys(values).some((key) => key !== 'opacity')) {
			node.style.transform = `translateX(${values.x ?? 0}px) translateY(${values.y ?? 0}px) scale(${values.scale ?? 1}) scaleX(${values.scaleX ?? 1}) scaleY(${values.scaleY ?? 1}) rotate(${values.rotate ?? 0}deg)`
		}
	}

	const toBox = (rect: { left: number; top: number; right: number; bottom: number }): Box => ({
		x: { min: rect.left, max: rect.right },
		y: { min: rect.top, max: rect.bottom },
	})

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
			restorePaint()
			projecting = false
			node.style.transform = transform
			node.style.transformOrigin = transformOrigin
			node.style.opacity = opacity
		},
		measureLayout(): Measurement | null {
			const measuredBox = toBox(node.getBoundingClientRect())
			// Compare content coordinates across commits. Scrolling an ancestor
			// moves the viewport box without changing the element's layout.
			const viewportOffset = captureViewportOffset(node)
			const offset = viewportOffset()
			const scrollX = -offset.x,
				scrollY = -offset.y
			const layoutBox = toBox({
				left: measuredBox.x.min + scrollX,
				top: measuredBox.y.min + scrollY,
				right: measuredBox.x.max + scrollX,
				bottom: measuredBox.y.max + scrollY,
			})

			// Channel transforms are subtracted mathematically so the layout box
			// stays transform-free; a projection transform is reset before reads.
			if (!projecting) {
				removeBoxTransforms(layoutBox, latestValues)
				removeBoxTransforms(measuredBox, latestValues)
			}
			return { layoutBox, measuredBox, viewportOffset }
		},
		resetProjection() {
			restorePaint()
			if (projecting) {
				node.style.transform = 'none'
			}
		},
		project(write: ProjectionWrite | null) {
			if (!write) {
				restorePaint()
				projecting = false
				node.style.transformOrigin = transformOrigin
				node.style.transform = transform
				this.write(latestValues)
				return
			}

			correctPaint(write)
			latestValues = write.latest
			projecting = true
			node.style.transform = buildProjectionTransform(write.delta, write.treeScale, {
				rotate: write.latest.rotate ?? 0,
			})
			node.style.transformOrigin = `${write.delta.x.origin * 100}% ${write.delta.y.origin * 100}% 0`
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
