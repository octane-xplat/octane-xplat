import { Application, Screen } from '@nativescript/core'
import type { ResizableBasisSource } from './resize-state'

/** Native basis — the `containerRef` view's measured size when supplied,
 *  else the device screen. `layoutChanged` on the container tracks bounds;
 *  orientation changes re-measure the screen fallback. */
export const nativeBasisSource: ResizableBasisSource = {
	storagePrefix: 'astryx-resizable:',
	measure: (containerRef, direction) => {
		const view = containerRef?.current
		if (view) {
			const size = view.getActualSize?.()
			const v = direction === 'horizontal' ? size?.width : size?.height
			return v != null && v > 0 ? v : null
		}

		return direction === 'horizontal' ? Screen.mainScreen.widthDIPs : Screen.mainScreen.heightDIPs
	},
	observe: (containerRef, _direction, cb) => {
		const view = containerRef?.current
		if (view) {
			view.on?.('layoutChanged', cb)
			return () => view.off?.('layoutChanged', cb)
		}

		Application.on('orientationChanged', cb)
		return () => Application.off('orientationChanged', cb)
	},
}
