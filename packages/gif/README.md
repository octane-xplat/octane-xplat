# `@octane-xplat/gif`

```sh
pnpm add @octane-xplat/gif
```

Animated images (GIF, animated WebP) for Octane xplat apps: a plain
`<img>` on web and `@nativescript-community/ui-image`
(Fresco on Android / SDWebImage on iOS) on native, with a macOS entry.

```tsx
import { AnimatedImage } from '@octane-xplat/gif'

;<AnimatedImage
	src="https://example.com/loader.gif"
	alt="Loading"
	stretch="aspectFit" // 'none' | 'fill' | 'aspectFit' | 'aspectFill'
	width={96}
	height={96}
/>
```

`stretch` shares the core `Image` grammar — web maps it to `object-fit`
and the plugin accepts the same values natively. For Lottie JSON
animations use [`@octane-xplat/lottie`](../lottie/README.md) instead.

## Prefetch

`prefetch` warms the image engine's disk cache for URLs you expect to show
soon — bytes on disk now, decode still at display time:

```tsx
import { prefetch } from '@octane-xplat/gif'

await prefetch(feed.map((post) => post.imageUrl)) // false if any URL fails
```

On Android that is Fresco's `prefetchToDiskCache`; on iOS, SDWebImage's
prefetcher storing to disk. On web it loads each URL through a throwaway
`<img>` so the browser HTTP cache is warm. It resolves `false` when any URL
fails — and always `false` on macOS, where the AppKit host has no image
pipeline yet.

## Platform props

`ios`, `android`, and `web` escape bags apply after the shared props, the
same convention as `@octane-xplat/ui`. Native bags assign onto the ui-image
`Img` view, so engine props such as `noCache`, `decodeWidth`,
`decodeHeight`, `placeholderImageUri`, and `progressiveRenderingEnabled`
are reachable where the engine supports them:

```tsx
<AnimatedImage
	src={photo.url}
	ios={{ noCache: true }}
	android={{ decodeWidth: 288, decodeHeight: 288 }}
/>
```

Per-target limits are recorded in
[known limits](../../docs/verify/known-limits.md). Exercised by
[`AnimatedImageDemo`](../demos/src/AnimatedImageDemo.tsrx).
