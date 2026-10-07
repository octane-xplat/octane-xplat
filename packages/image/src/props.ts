import type { ImageProps as CoreImageProps } from '@octane-xplat/ui';

// The leaf's Image is a drop-in for `@octane-xplat/ui`'s Image — same name,
// same props. The core contract types come straight from ui so the leaf can
// never drift from them; swapping engines is an import-path change.
export type {
	ImageContentFit,
	ImageContentPosition,
	ImageContentPositionObject,
	ImageContentPositionString,
	ImageContentPositionValue,
	ImageDecoding,
	ImageSourceLike,
} from '@octane-xplat/ui';

/** How the engine's caches participate in a load. The plugin exposes a single
 *  all-off switch (`noCache` → Glide `skipMemoryCache` + `DiskCacheStrategy.NONE`
 *  on Android, `SDWebImageOptions.FromLoaderOnly` on iOS), so the only honest
 *  non-default value is 'none'. 'memory'/'disk' splits are not representable
 *  through the plugin's request options today. Ignored on web — browsers own
 *  their HTTP cache. */
export type ImageCachePolicy = 'memory-disk' | 'none'

export interface ImageLoadEvent {
	/** Decoded bitmap size in pixels. */
	width: number
	height: number
	/** Where the engine served the image from. Absent on web — the browser
	 *  does not report which cache (if any) satisfied an <img>. */
	source?: 'network' | 'memory' | 'disk' | 'local'
}

export interface ImageErrorEvent {
	error: Error
}

/** Cache sizing/eviction applied through `initializeImageCache`. Native only —
 *  the web engine (browser HTTP cache) offers no equivalent knobs. */
export interface ImageCacheConfig {
	/** In-memory bitmap cache size in bytes (Android Glide). */
	memoryCacheSize?: number
	/** Size the memory cache as N fullscreen bitmaps (Android Glide). */
	memoryCacheScreens?: number
	/** Persist the cache-key registry across launches so evictions stay
	 *  consistent (Android SharedPreferences store). */
	persistentCacheKeys?: boolean
	/** Bump to invalidate every cached entry — Glide `ObjectKey` signature. */
	globalSignatureKey?: string
	/** iOS: track transformed cache keys for eviction. Needed when decodeWidth/
	 *  decodeHeight (or other transforms) are used alongside evictImage —
	 *  transformed images key differently than the raw URL. */
	iosComplexCacheEviction?: boolean
}

/** Result of `isImageCached`. 'none' also covers "unknown" — on web the
 *  browser cache is not queryable, so web always reports 'none'. */
export type ImageCacheState = 'memory' | 'disk' | 'none'

/** Image — drop-in alternative to `@octane-xplat/ui`'s Image backed by a real
 *  image engine (Glide on Android, SDWebImage on iOS via
 *  `@nativescript-community/ui-image`): sized in-memory bitmap cache, disk
 *  cache, decode-to-view-size, placeholders and transitions. Web renders a
 *  plain <img>. Every `@octane-xplat/ui` Image prop is accepted with the same
 *  meaning — the members below are engine extensions with no core equivalent;
 *  they are ignored on web. SVG `src` is the one behavioral gap — keep core
 *  `Image` for those. One asymmetry: `decoding='sync'` is not honorably
 *  supported — Glide/SDWebImage have no synchronous decode mode (the plugin's
 *  `loadMode` prop is registered but never read), so 'sync' degrades to
 *  async on native with a console warning rather than a fake. */
export interface ImageProps extends CoreImageProps {
	/** Native only — 'none' bypasses memory and disk caches for this image.
	 *  Default 'memory-disk' leaves both caches active. */
	cachePolicy?: ImageCachePolicy
	/** Native only — image shown when `src` fails (`failureImageUri`). */
	failureImage?: string
	/** Native only — extra HTTP headers for the request (authenticated URLs). */
	headers?: Record<string, string>
	/** Native only — explicit decode bounds in device pixels. Default is the
	 *  view's laid-out size (the src is held until first layout so the engine
	 *  never decodes at full source resolution). */
	decodeWidth?: number
	decodeHeight?: number
	/** Native only — progressive/interlaced rendering while bytes stream. */
	progressive?: boolean
	/** Native only — crossfade duration in ms when the image lands (0
	 *  disables; engine default applies when unset). */
	fadeDuration?: number
	/** Fired when the final image is set. `source` reports which cache level
	 *  served the bitmap — native only; web fires without `source`. */
	onLoad?: (event: ImageLoadEvent) => void
	/** Fired when the load fails. */
	onError?: (event: ImageErrorEvent) => void
}
