import type { PrefetchOptions } from './props'

/** prefetch — no-op on Windows: there is no image pipeline to warm
 *  (AnimatedImage renders a placeholder there). Resolves false to report
 *  that honestly. */
export function prefetch(_srcs: string | string[], _options?: PrefetchOptions): Promise<boolean> {
	return Promise.resolve(false)
}
