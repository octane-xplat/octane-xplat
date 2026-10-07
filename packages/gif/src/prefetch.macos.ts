import type { PrefetchOptions } from './props'

/** prefetch — no-op on the AppKit host: it has no image pipeline yet
 *  (AnimatedImage renders a placeholder there), so nothing is warmed.
 *  Resolves false to report that honestly. */
export function prefetch(_srcs: string | string[], _options?: PrefetchOptions): Promise<boolean> {
	return Promise.resolve(false)
}
