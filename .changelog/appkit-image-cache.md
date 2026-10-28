AppKit image helpers now prefetch HTTP(S) bytes without decoding, report memory
or disk presence, and evict or clear image-owned caches. Displayed images use
the same byte cache. Failed or non-cacheable prefetch resolves false; native
persistence, networking, responsiveness and packaging remain unqualified.

```ts
import { prefetch, isImageCached, evictImage } from '@octane-xplat/image'
const src = 'https://example.com/photo.png'
const warmed = await prefetch(src, { concurrency: 2 })
console.log(warmed, (await isImageCached(src))[src])
await evictImage(src)
```

AppKit HTTP image loading now uses a credential-free dedicated session instead
of shared cookies/credentials. Configuration fields that previously did nothing
now throw; use `initializeImageCache()` with default options. Display headers
now fail before loading instead of being ignored. `cachePolicy="none"` now
bypasses framework memory/disk caches when UI and renderer support match. Header-aware
prefetch, transform queries and other engine extensions remain unsupported.
Eviction preserves mounted images and does not purge unrelated HTTP/account data.
See the [AppKit image subset](https://github.com/octane-xplat/octane-xplat/tree/main/packages/image#appkit-subset).

```tsx
import { Image } from '@octane-xplat/image'
export function FreshPhoto({ src }: { src: string }) {
	return <Image src={src} cachePolicy="none" alt="Photo" style={{ width: 120, height: 80 }} />
}
```
