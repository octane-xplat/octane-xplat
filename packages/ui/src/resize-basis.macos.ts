import type { ResizableBasisSource } from './resize-state'

/** AppKit basis — the `containerRef` view's frame when supplied, else the
 *  host window's size via the bridge when it reports one. */
export const macosBasisSource: ResizableBasisSource = {
	storagePrefix: 'astryx-resizable:',
	measure: (containerRef, direction) => {
		const view = containerRef?.current
		const frame = view?.frame
		if (frame) {
			const v = direction === 'horizontal' ? frame.size?.width : frame.size?.height
			return v != null && v > 0 ? v : null
		}

		const host = (globalThis as any).__xplatAppKit?.getWindowSize?.()
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
