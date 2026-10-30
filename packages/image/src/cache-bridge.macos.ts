import type { ImageCacheConfig, ImageCacheQueryOptions, ImageCacheState, PrefetchOptions, ImageLoadEvent, ImageErrorEvent } from './props'
import { prefetchBatch } from './prefetch-batch.ts'
interface ImageCacheBridge {
	readonly supportsCachePolicy?: boolean
	readonly supportsLoadEvents?: boolean
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
			if (config && Object.values(config).some((value) => value !== undefined)) {throw new TypeError('AppKit image cache configuration options are not implemented')}
			bridge()?.initialize()
		},
		async prefetch(srcs: string | string[], options?: PrefetchOptions): Promise<boolean> {
			if (options?.headers && Object.keys(options.headers).length) {return false}
			try {
				const cache = bridge()
				if (!cache) {return false}
				return await prefetchBatch(srcs, options?.concurrency, (source) => cache.prefetch(source))
			} catch { return false }
		},
		async evict(source: string): Promise<boolean> { try { return bridge()?.evict(source) === true } catch { return false } },
		async clear(): Promise<void> {
			const cache = bridge()
			if (cache && !cache.clear()) {throw new Error('AppKit image cache could not be cleared')}
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
	if (options.cachePolicy != null && options.cachePolicy !== 'none' && options.cachePolicy !== 'memory-disk') {throw new TypeError('Invalid AppKit Image cache policy')}
	if (options.headers && Object.keys(options.headers).length) {throw new TypeError('AppKit Image request headers are not implemented')}
}

/** Private typed handoff to CoreImage, preserving its layout/source normalization. */
export function withAppKitImageRequest<T extends { onLoad?: (event: ImageLoadEvent) => void; onError?: (event: ImageErrorEvent) => void; cachePolicy?: 'memory-disk' | 'none'; headers?: Record<string, string> }>(
	props: T, core: object, bridge: () => ImageCacheBridge | undefined = () => Reflect.get(globalThis, '__xplatAppKit')?.imageCache,
): T & { __appKitImageCachePolicy: 'memory-disk' | 'none'; __appKitImageLoad?: (event: ImageLoadEvent) => void; __appKitImageError?: (event: ImageErrorEvent) => void } {
	validateAppKitImageOptions(props)
	if (props.cachePolicy === 'none' && (Reflect.get(core, '__xplatAppKitImagePolicy') !== true || bridge()?.supportsCachePolicy !== true)) {
		throw new Error('AppKit Image cache bypass requires matching UI and renderer support')
	}
	if ((props.onLoad || props.onError) && (Reflect.get(core, '__xplatAppKitImageEvents') !== true || bridge()?.supportsLoadEvents !== true)) {
		throw new Error('AppKit Image callbacks require matching UI and renderer support')
	}
	return { ...props, __appKitImageCachePolicy: props.cachePolicy ?? 'memory-disk', __appKitImageLoad: props.onLoad, __appKitImageError: props.onError }
}
