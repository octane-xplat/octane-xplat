/** VENDORED — identical copy in packages/gif/src/prefetch-batch.ts; keep in
 *  sync.
 *
 *  Shared batch driver for the image-engine leaves' `prefetch` contract:
 *  normalizes `string | string[]`, caps in-flight requests JS-side, and
 *  resolves `true` only when every URL warms — `false` on the first failure
 *  (in-flight requests settle on their own; the result is already decided). */

/** Matches the `maxRequests = 5` ceiling NS core's ImageCache used. */
export const DEFAULT_PREFETCH_CONCURRENCY = 5

export function prefetchBatch(
	srcs: string | string[],
	concurrency: number | undefined,
	warm: (url: string) => Promise<boolean>,
): Promise<boolean> {
	const urls = Array.isArray(srcs) ? srcs : [srcs]
	if (urls.length === 0) {
		return Promise.resolve(true)
	}

	const requested = Math.floor(concurrency ?? DEFAULT_PREFETCH_CONCURRENCY)
	const limit =
		Number.isFinite(requested) && requested > 0 ? requested : DEFAULT_PREFETCH_CONCURRENCY

	return new Promise<boolean>((resolve) => {
		let next = 0
		let active = Math.min(limit, urls.length)
		for (let i = 0; i < active; i++) {
			void (async () => {
				while (next < urls.length) {
					const url = urls[next++]
					try {
						if (!(await warm(url))) {
							resolve(false)
							return
						}
					} catch {
						resolve(false)
						return
					}
				}

				if (--active === 0) {
					resolve(true)
				}
			})()
		}
	})
}
