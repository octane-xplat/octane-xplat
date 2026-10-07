import type { ImageProps } from './generated/props.js'

export type {
	ImageCacheConfig,
	ImageCachePolicy,
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
} from './generated/props.js'

export declare function Image(props: ImageProps): unknown
export declare function initializeImageCache(config?: import('./generated/props.js').ImageCacheConfig): void
export declare function prefetchImage(src: string): Promise<void>
export declare function evictImage(src: string): Promise<boolean>
export declare function clearImageCaches(): Promise<void>
export declare function isImageCached(src: string): Promise<import('./generated/props.js').ImageCacheState>
