// Platform barrels — explicit .tsrx leaf imports (moduleSuffixes don't
// reach .tsrx; same convention as @octane-xplat/ui index.*.ts).
export { Image } from './Image.tsrx'
export {
	clearImageCaches,
	evictImage,
	initializeImageCache,
	isImageCached,
	prefetchImage,
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
	ImageErrorEvent,
	ImageLoadEvent,
	ImageProps,
	ImageSourceLike,
} from './props'
