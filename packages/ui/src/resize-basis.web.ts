import type { ResizableBasisSource } from './resize-state'

/** Web basis — the `containerRef` element's content box when supplied, else
 *  the viewport. ResizeObserver tracks the container; window resize tracks
 *  the viewport fallback. Storage prefix matches upstream so a migrated app
 *  keeps saved sizes. */
export const webBasisSource: ResizableBasisSource = {
	storagePrefix: 'astryx-resizable:',
	measure: (containerRef, direction) => {
		const el = containerRef?.current as HTMLElement | null | undefined
		if (el) {
			const v = direction === 'horizontal' ? el.clientWidth : el.clientHeight
			return v > 0 ? v : null
		}

		if (typeof window === 'undefined') {return null}
		return direction === 'horizontal' ? window.innerWidth : window.innerHeight
	},
	observe: (containerRef, _direction, cb) => {
		const el = containerRef?.current as HTMLElement | null | undefined
		if (el && typeof ResizeObserver !== 'undefined') {
			const ro = new ResizeObserver(cb)
			ro.observe(el)
			return () => ro.disconnect()
		}

		if (typeof window === 'undefined') {return () => {}}
		window.addEventListener('resize', cb)
		return () => window.removeEventListener('resize', cb)
	},
}
