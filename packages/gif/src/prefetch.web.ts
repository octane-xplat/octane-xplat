import type { PrefetchOptions } from './props'

/** prefetch — load each `src` through a throwaway <img> so the response lands
 *  in the browser HTTP cache; decode and render stay with the displaying
 *  element. `options` is accepted for signature parity but ignored — an <img>
 *  request cannot carry custom headers. Resolves false when any URL fails. */
export function prefetch(srcs: string | string[], _options?: PrefetchOptions): Promise<boolean> {
	const urls = Array.isArray(srcs) ? srcs : [srcs]
	if (urls.length === 0) {
		return Promise.resolve(true)
	}

	return Promise.all(
		urls.map(
			(url) =>
				new Promise<boolean>((resolve) => {
					const image = new Image()
					image.onload = () => resolve(true)
					image.onerror = () => resolve(false)
					image.src = url
				}),
		),
	).then((results) => results.every(Boolean))
}
