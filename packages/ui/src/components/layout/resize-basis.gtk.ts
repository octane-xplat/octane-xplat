import type { ResizableBasisSource } from './resize-state'
import { hostGlobal } from '../../internal/platform/host-bridge'

/** GTK basis — the `containerRef` view's measured size when supplied (the
 *  public instance's getActualSize + layoutChanged watch), else the host
 *  window's content size through the __octaneGtkHost bridge — the windowed
 *  analog of the native screen fallback. */
export const nativeBasisSource: ResizableBasisSource = {
	storagePrefix: 'astryx-resizable:',
	measure: (containerRef, direction) => {
		const view = containerRef?.current
		const size = view?.getActualSize?.()
		const measured = direction === 'horizontal' ? size?.width : size?.height
		if (measured != null && measured > 0) {
			return measured
		}

		const host = hostGlobal('__octaneGtkHost')?.getWindowSize?.()
		if (host) {
			return direction === 'horizontal' ? host.width : host.height
		}

		return null
	},
	observe: (containerRef, _direction, cb) => {
		const view = containerRef?.current
		if (view?.on) {
			view.on('layoutChanged', cb)
			return () => view.off?.('layoutChanged', cb)
		}

		return () => {}
	},
}
