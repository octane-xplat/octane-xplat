// Windows barrel — explicit leaf imports keep @nativescript-community/
// ui-image (iOS/Android only) out of the windows graph at the file boundary.
export { AnimatedImage } from './AnimatedImage.windows.tsrx'
export { prefetch } from './prefetch.windows'
export type { AnimatedImageProps, PrefetchOptions } from './props'
