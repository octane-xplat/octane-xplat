import type { ImageCacheConfig, ImageCacheQueryOptions, ImageCacheState, PrefetchOptions } from './props'
import { prefetchBatch } from './prefetch-batch.ts'
interface ImageCacheBridge {
	initialize(): boolean
	prefetch(source: string): Promise<boolean>
	isCached(source: string): ImageCacheState
	evict(source: string): boolean
	clear(): boolean
}
/** Private adapter. Never substitute another host's cache or persist headers
 * under a URL-only key; unsupported options remain explicit AppKit limits. */
export function createAppKitImageCache(bridge: () => ImageCacheBridge | undefined = () => Reflect.get(globalThis, '__xplatAppKit')?.imageCache) {
	return {
		initialize(config?: ImageCacheConfig): void {
			if (config && Object.values(config).some((value) => value !== undefined)) throw new TypeError('AppKit image cache configuration options are not implemented')
			bridge()?.initialize()
		},
		async prefetch(srcs: string | string[], options?: PrefetchOptions): Promise<boolean> {
			if (options?.headers && Object.keys(options.headers).length) return false
			try {
				const cache = bridge()
				if (!cache) return false
				return await prefetchBatch(srcs, options?.concurrency, (source) => cache.prefetch(source))
			} catch { return false }
		},
		async evict(source: string): Promise<boolean> { try { return bridge()?.evict(source) === true } catch { return false } },
		async clear(): Promise<void> {
			const cache = bridge()
			if (cache && !cache.clear()) throw new Error('AppKit image cache could not be cleared')
		},
		async query(srcs: string | readonly string[], options?: ImageCacheQueryOptions): Promise<Record<string, ImageCacheState>> {
			const states: Record<string, ImageCacheState> = {}
			for (const source of typeof srcs === 'string' ? [srcs] : srcs) {
				let state: ImageCacheState = 'none'
				if (options?.decodeWidth === undefined && options?.decodeHeight === undefined) {
					try { state = bridge()?.isCached(source) ?? 'none' } catch {}
				}
				Object.defineProperty(states, source, { configurable: true, enumerable: true, writable: true, value: state })
			}
			return states
		},
	}
}

/** Reject unsupported requests before a persistent display load can begin. */
export function validateAppKitImageOptions(options: { cachePolicy?: string; headers?: Record<string, string> }): void {
	if (options.cachePolicy === 'none') throw new TypeError('AppKit Image cachePolicy="none" is not implemented')
	if (options.headers && Object.keys(options.headers).length) throw new TypeError('AppKit Image request headers are not implemented')
}
