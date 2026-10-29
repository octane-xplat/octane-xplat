import type { PrefetchOptions } from './props'

/** AppKit display uses an owned ephemeral session, without a shared GIF cache.
 *  No prefetch pipeline is implemented; resolves false. */
export function prefetch(_srcs: string | string[], _options?: PrefetchOptions): Promise<boolean> {
	return Promise.resolve(false)
}
