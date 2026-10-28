# `@octane-xplat/image`

Cached remote/local images for Octane xplat apps: a plain `<img>` on web and
[`@nativescript-community/ui-image`](https://github.com/nativescript-community/ui-image)
v5 on native — **Glide + okhttp3 on Android** (sized LRU memory cache, bitmap
pool, disk cache, decode-to-view-size) and **SDWebImage on iOS**. This is the
fix for the core `image`'s 5 MB `LruCache`, which evicts visible images
mid-scroll and re-decodes them.

**Recommended image path for iOS/Android apps.** `Image` is a drop-in
for `@octane-xplat/ui`'s `Image` — the same name and the same prop contract
(`src` incl. `ImageSourceLike[]` multi-source, `alt`, `placeholder`,
`recyclingKey`, `contentFit`, `contentPosition`, layout-child props,
`ios`/`android`/`web` bags). Switching engines is an import-path change:

```sh
pnpm add @octane-xplat/image
```

```tsx
import { Image } from '@octane-xplat/image' // was '@octane-xplat/ui'
```

plus the engine's own knobs on top:

```tsx
import { Image, initializeImageCache, prefetch } from '@octane-xplat/image'

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

// Warm the disk cache ahead of a feed scroll (bytes only — decode at
// display). One URL or a batch; resolves false if any URL fails.
await prefetch('https://example.com/next.jpg')
await prefetch(
	feed.map((post) => post.imageUrl),
	{
		headers: { Authorization: 'Bearer …' }, // Android only — see below
		concurrency: 5, // max parallel fetches (default)
	},
)
```

`onLoad`'s `source` field reports which cache level served the image
(`'memory'` / `'disk'` / `'network'` / `'local'`) — the cheapest way to prove
the cache is doing its job.

Cache functions: `prefetch`, `evictImage`, `clearImageCaches`,
`isImageCached`, `initializeImageCache` — the same contract
`@octane-xplat/gif`'s `prefetch` carries. On web they degrade honestly:
`prefetch` warms the browser HTTP cache through a throwaway `<img>` per URL,
awaited until the response lands (resolves `false` if any URL fails); the
rest are documented no-ops, and macOS `prefetch` resolves `false` since the
AppKit host has no image pipeline.

`prefetch` options: `headers` forwards request headers to the engine —
honored on Android and iOS with the framework patch —
and ignored on web, where a plain `<img>` cannot send custom headers.
`concurrency` caps parallel fetches JS-side (default 5).

`prefetch` always warms the disk cache, and there is no memory option. A
later `<Image>` only reads the disk copy. On both engines, a memory prefetch
stores a bitmap that `<Image>` never reuses, so it just costs an extra
decode.

iOS parity note: `ui-image` 5.x releases before 5.0.18 dropped the 4.x wiring
that let prefetch honor its cache level and forward request `headers`; 5.0.18
restored both upstream (nativescript-community/ui-image#69) — a disk prefetch
writes encoded bytes to disk without decoding or warming memory (matching
Android's Glide `downloadOnly`), a memory prefetch stays off disk, and a
prefetch carrying `headers` sends them on iOS the same as Android.

`isImageCached` takes one URL or a list and always resolves a `Record` keyed by URL — the RN `queryCache`
shape:

```ts
const states = await isImageCached(['https://example.com/a.jpg', 'https://example.com/b.jpg'])
// states['https://example.com/a.jpg'] === 'memory' | 'disk' | 'none'
```

On iOS the cache key includes the decode bounds a display load used, so
probe with the same `decodeWidth`/`decodeHeight` to match it:

```ts
await isImageCached(url, { decodeWidth: 600, decodeHeight: 400 })
```

Android caveat: the plugin's probe can't see Glide's active resources, so a
bitmap still on screen may report `'none'` — treat `'none'` as "not provably
cached", not "absent".

## AppKit subset

The macOS leaf delegates to the core AppKit `Image`, keeping source grammar,
local placeholders, parent layout, composed classes and style forms consistent.
It uses the renderer's shared bounded decoded-image cache and request lifecycle,
not Glide or SDWebImage. Last-subscriber removal cancels pending work; HTTP error
responses are not decoded or cached. Real network/main-queue behavior, layout
and packaging remain unqualified.

```tsx
import { Image } from '@octane-xplat/image'

export function Preview({ src }: { src: string }) {
	return <Image src={src} alt="Photo" placeholder="~/thumbnail.png"
		contentFit="contain" style={{ width: 120, height: 80 }} />
}
```

AppKit cache-control functions remain stubs (`prefetch`/`evictImage` return
false, cache queries return none, initialization/clear do nothing). Headers,
cachePolicy, decode bounds, failureImage, progressive loading, transitions and
onLoad/onError are unimplemented. Fit/position use the core AppKit clipped drawing path in logical points;
source-set choice and decode scheduling remain incomplete. Native fit/crop,
orientation and density are not runtime-qualified. See
[AppKit image loading](../../docs/app/components.md#image-loading-on-appkit).

```ts
import { prefetch, isImageCached } from '@octane-xplat/image'

// On AppKit these remain false / 'none'; this does not query the renderer cache.
const warmed = await prefetch('https://example.com/photo.png')
const state = await isImageCached('https://example.com/photo.png')
console.log(warmed, state)
```

## Divergences from core `Image`

- **No SVG sources** — Glide/SDWebImage don't decode SVG. Keep core `Image`
  for `svg` markup/data URIs/`.svg` URLs.
- **`cachePolicy` has only two honest values.** The plugin exposes a single
  all-off switch (`noCache` → Glide `skipMemoryCache` +
  `DiskCacheStrategy.NONE`, SDWebImage `FromLoaderOnly`), so
  `'memory'`/`'disk'` splits are not representable — only `'memory-disk'`
  (default) and `'none'`.
- **`decoding='sync'` is not honorably supported.** Glide/SDWebImage have no
  synchronous decode mode — the ui-image plugin's `loadMode` prop is
  registered but never read — so 'sync' degrades to the async default with
  a console warning. If synchronous decode is a hard requirement, use core
  `Image` (NS `loadMode` honors it for file/resource/data srcs). On web the
  prop maps 1:1 to the HTML `decoding` attribute, as it does on core.
- Engine extras (`failureImage`, `headers`, `decodeWidth`, `decodeHeight`,
  `progressive`, `fadeDuration`, `cachePolicy`) are native-only and ignored on
  web.
- macOS renders through the same AppKit `<image>` path as core `Image` — no
  engine there; cache helpers resolve as no-ops.

Per-target limits are recorded in
[known limits](https://octane-xplat.goddardai.org/known-limits). Exercised by
[`CachedImageDemo`](https://github.com/octane-xplat/octane-xplat/blob/main/packages/demos/src/CachedImageDemo.tsrx).
