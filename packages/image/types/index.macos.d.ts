import type { ImageProps } from './generated/props.js'

export type {
	ImageCacheConfig,
	ImageCachePolicy,
	ImageCacheQueryOptions,
	ImageCacheState,
	ImageContentFit,
	ImageContentPosition,
	ImageContentPositionObject,
	ImageContentPositionString,
	ImageContentPositionValue,
	ImageErrorEvent,
	ImageLoadEvent,
	ImageProps,
	ImageSourceLike,
	PrefetchOptions,
} from './generated/props.js'

export declare function Image(props: ImageProps): unknown
export declare function initializeImageCache(config?: import('./generated/props.js').ImageCacheConfig): void
export declare function prefetch(srcs: string | string[], options?: PrefetchOptions): Promise<boolean>
export declare function evictImage(src: string): Promise<boolean>
export declare function clearImageCaches(): Promise<void>
export declare function isImageCached(
	srcs: string | readonly string[],
	options?: import('./generated/props.js').ImageCacheQueryOptions,
): Promise<Record<string, import('./generated/props.js').ImageCacheState>>
