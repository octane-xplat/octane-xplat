// Platform barrels — explicit .tsrx leaf imports (moduleSuffixes don't
// reach .tsrx; same convention as @octane-xplat/ui index.*.ts).
export { AnimatedImage } from './AnimatedImage.web.tsrx'
export { prefetch } from './prefetch.web'
export type { AnimatedImageProps, PrefetchOptions } from './props'
