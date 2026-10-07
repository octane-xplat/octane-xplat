import { prefetchBatch } from './prefetch-batch'
import type { PrefetchOptions } from './props'

/** prefetch — load each `src` through a throwaway <img> so the response lands
 *  in the browser HTTP cache; decode and render stay with the displaying
 *  element. `options.headers` is ignored — an <img> request cannot carry
 *  custom headers. `options.concurrency` caps parallel loads (default 5).
 *  Resolves false when any URL fails. */
export function prefetch(srcs: string | string[], options?: PrefetchOptions): Promise<boolean> {
	return prefetchBatch(
		srcs,
		options?.concurrency,
		(url) =>
			new Promise<boolean>((resolve) => {
				const image = new Image()
				image.onload = () => resolve(true)
				image.onerror = () => resolve(false)
				image.src = url
			}),
	)
}
