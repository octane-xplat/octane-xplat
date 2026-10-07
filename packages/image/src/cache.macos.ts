import type { ImageCacheConfig, ImageCacheState } from './props';

/** No-op — the AppKit host has no image engine. */
export function initializeImageCache(_config?: ImageCacheConfig): void {}
export function prefetchImage(_src: string): Promise<void> {
	return Promise.resolve();
}

export function evictImage(_src: string): Promise<boolean> {
	return Promise.resolve(false);
}

export function clearImageCaches(): Promise<void> {
	return Promise.resolve();
}

export function isImageCached(_src: string): Promise<ImageCacheState> {
	return Promise.resolve('none');
}
