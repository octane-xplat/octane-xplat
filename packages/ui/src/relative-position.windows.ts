/** WinUI supplies view-relative DIPs; pinned core's common method is a no-op. */
export function relativePosition(view: any, relativeTo: any): { x: number; y: number } | undefined {
	const native = view?.nativeViewProtected
	const target = relativeTo?.nativeViewProtected
	if (!native || !target) return
	try {
		const point = native.TransformToVisual(target).TransformPoint({ X: 0, Y: 0 })
		const x = point.X ?? point.x
		const y = point.Y ?? point.y
		if (Number.isFinite(x) && Number.isFinite(y)) return { x, y }
	} catch {
		// Detached views have no shared visual tree; a later layout retries.
	}
}
