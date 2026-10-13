import type { CameraPreviewPoint } from './types'

/** Attach a notification-only 'tap' observer to a preview host view and
 *  report each tap as a `CameraPreviewPoint` normalized to the view's
 *  bounds. The tap gesture never consumes the touch — recognizers layered
 *  above the preview still see it. Platforms whose runtime never
 *  dispatches 'tap' simply never fire the callback. */
export function observePreviewTap(
	view: any,
	onTap: ((point: CameraPreviewPoint) => void) | undefined,
): () => void {
	if (!view || !onTap || typeof view.on !== 'function') {
		return () => {}
	}

	const handler = (args: any) => {
		const size = view.getActualSize?.()
		const width = size?.width ?? 0
		const height = size?.height ?? 0
		const x = typeof args?.getX === 'function' ? args.getX() : NaN
		const y = typeof args?.getY === 'function' ? args.getY() : NaN
		if (!(width > 0) || !(height > 0) || !Number.isFinite(x) || !Number.isFinite(y)) {
			return
		}

		onTap({
			x: Math.min(1, Math.max(0, x / width)),
			y: Math.min(1, Math.max(0, y / height)),
		})
	}

	view.on('tap', handler)
	return () => view.off?.('tap', handler)
}
