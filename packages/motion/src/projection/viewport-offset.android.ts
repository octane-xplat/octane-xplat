import type { Point } from './types'

export function captureViewportOffset(view: any): () => Point {
	const native = view?.nativeView ?? view?.android
	const density = native?.getResources()?.getDisplayMetrics()?.density ?? 1
	const ancestors: any[] = []
	for (
		let parent = native?.getParent?.();
		typeof parent?.getLeft === 'function';
		parent = parent.getParent?.()
	) {
		ancestors.push(parent)
	}
	return () => ({
		x: -ancestors.reduce((sum, parent) => sum + (parent.getScrollX?.() ?? 0), 0) / density,
		y: -ancestors.reduce((sum, parent) => sum + (parent.getScrollY?.() ?? 0), 0) / density,
	})
}
