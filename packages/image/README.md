# `@octane-xplat/image`

```sh
pnpm add @octane-xplat/image
```

Cached remote/local images for Octane xplat apps: a plain `<img>` on web and
[`@nativescript-community/ui-image`](https://github.com/nativescript-community/ui-image)
v5 on native — **Glide + okhttp3 on Android** (sized LRU memory cache, bitmap
pool, disk cache, decode-to-view-size) and **SDWebImage on iOS**. This is the
fix for the core `image`'s 5 MB `LruCache`, which evicts visible images
mid-scroll and re-decodes them.

**Recommended image path for apps with native targets.** `Image` is a drop-in
for `@octane-xplat/ui`'s `Image` — the same name and the same prop contract
(`src` incl. `ImageSourceLike[]` multi-source, `alt`, `placeholder`,
`recyclingKey`, `contentFit`, `contentPosition`, layout-child props,
`ios`/`android`/`web` bags). Switching engines is an import-path change:

```tsx
import { Image } from '@octane-xplat/image' // was '@octane-xplat/ui'
```

plus the engine's own knobs on top:

```tsx
import { Image, initializeImageCache, prefetchImage } from '@octane-xplat/image'

// Optional, app entry: size the memory cache before the first render.
initializeImageCache({ memoryCacheScreens: 2 })

;<Image
	src="https://example.com/photo.jpg"
	alt="Trailhead"
	contentFit="cover" // 'cover' | 'contain' | 'fill' | 'none' | 'scale-down'
	placeholder="blurhash:LEHV6nWB2yk8pyo0adR*.7kCMdnj" // or res://, ~/, file, data:
	cachePolicy="memory-disk" // or 'none' to bypass both caches (native)
	failureImage="~/failed.png" // shown on load failure (native)
	headers={{ Authorization: 'Bearer …' }} // extra request headers (native)
	decodeWidth={600} // explicit decode bounds in device px; default = view size (native)
	onLoad={(e) => console.log(e.width, e.height, e.source)} // 'network'|'memory'|'disk'|'local' (native)
	onError={(e) => console.warn(e.error)}
/>

// Warm the disk cache ahead of a feed scroll (bytes only — decode at display).
await prefetchImage('https://example.com/next.jpg')
```

`onLoad`'s `source` field reports which cache level served the image
(`'memory'` / `'disk'` / `'network'` / `'local'`) — the cheapest way to prove
the cache is doing its job.

Cache functions: `prefetchImage`, `evictImage`, `clearImageCaches`,
`isImageCached`, `initializeImageCache`. On web they degrade honestly:
`prefetchImage` warms the browser HTTP cache via `new Image()`, the rest are
documented no-ops.

## Divergences from core `Image`

- **No SVG sources** — Glide/SDWebImage don't decode SVG. Keep core `Image`
  for `svg` markup/data URIs/`.svg` URLs.
- **`cachePolicy` has only two honest values.** The plugin exposes a single
  all-off switch (`noCache` → Glide `skipMemoryCache` +
  `DiskCacheStrategy.NONE`, SDWebImage `FromLoaderOnly`), so
  `'memory'`/`'disk'` splits are not representable — only `'memory-disk'`
  (default) and `'none'`.
- Engine extras (`failureImage`, `headers`, `decodeWidth`, `decodeHeight`,
  `progressive`, `fadeDuration`, `cachePolicy`) are native-only and ignored on
  web.
- macOS renders through the same AppKit `<image>` path as core `Image` — no
  engine there; cache helpers resolve as no-ops.

Per-target limits are recorded in
[known limits](../../docs/verify/known-limits.md). Exercised by
[`CachedImageDemo`](../demos/src/CachedImageDemo.tsrx).
