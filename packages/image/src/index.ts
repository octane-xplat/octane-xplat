// Platform barrels — explicit .tsrx leaf imports (moduleSuffixes don't
// reach .tsrx; same convention as @octane-xplat/ui index.*.ts).
export { Image } from './Image.tsrx'
export {
	clearImageCaches,
	evictImage,
	initializeImageCache,
	isImageCached,
	prefetch,
} from './cache'

export type {
	ImageCacheConfig,
	ImageCachePolicy,
	ImageCacheState,
	ImageContentFit,
	ImageContentPosition,
	ImageContentPositionObject,
	ImageContentPositionString,
	ImageContentPositionValue,
	ImageDecoding,
	ImageErrorEvent,
	ImageLoadEvent,
	ImageProps,
	PrefetchOptions,
	ImageSourceLike,
} from './props'
