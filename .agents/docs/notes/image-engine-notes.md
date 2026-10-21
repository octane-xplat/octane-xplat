# Image engine notes

Notes for `@octane-xplat/image`, which wraps
`@nativescript-community/ui-image` (Glide on Android, SDWebImage on iOS).

## Prefetch cache levels (`cachePolicy` on `prefetch`)

**Status:** unsupported. `prefetch()` only warms the disk cache. Expo-style
`cachePolicy: 'memory' | 'memory-disk'` was rejected for GH#6 on 2026-10-20.

**Upstream:** `@nativescript-community/ui-image` 5.0.18, which shipped
nativescript-community/ui-image#69 — iOS prefetch honors its `cacheType` and
forwards `headers` with no framework patch.

**Limitation:** a memory prefetch writes a bitmap entry that a later
`<Image>` display load never reads. This holds on both engines, with or
without matching `decodeWidth`/`decodeHeight`. The display key also folds
in the view's own transforms, and the prefetch API can't reproduce them.

**Runtime evidence:** a temporary probe
(`research/probes/prefetch-cache-policy.tsrx`) ran on local `main`
7d42cb29a with `--deps @octane-xplat/image,@triniwiz/nativescript-masonkit`.
Each case used a distinct URL. "Display" is the `onLoad` `source` of the
next `<Image>` that used the same decode bounds.

| Prefetch call                         | iOS (iPhone 18 Pro sim, iOS 27)         | Android (CPH2551 device)                    |
| ------------------------------------- | --------------------------------------- | ------------------------------------------- |
| `prefetchToDiskCache`                 | disk entry; display `disk`              | inconclusive (first mount laid out 0 high)  |
| `prefetchToMemoryCache(url, decode)`  | memory only, no disk; display `network` | memory **and** disk; display `disk`         |
| `prefetchToMemoryCache(url)`          | memory only, no disk; display `network` | memory **and** disk; display `disk`         |
| `prefetchToCacheType(url, 3, decode)` | memory and disk; display `disk`         | n/a (no Android equivalent)                 |
| no prefetch (control)                 | display `network`                       | display `network`                           |

On iOS, `'memory'` would download bytes the display load fetches again. On
Android, it equals a disk prefetch plus a wasted decode. Only the disk level
helps a display load, and that is what `prefetch()` already does.

**What would change this:** the plugin would need a prefetch that builds the
same request (decode size, scale, transforms) as the `Img` view. Re-run the
probe when upgrading ui-image.

**Open follow-ups seen during the runs (single observations, unconfirmed):**

- On Android, the first `<Image>` mounted in a fresh probe host laid out at
  height 0 and never fired `onLoad`, despite `style={{ height: 120 }}`.
- On Android, `isImageCached` reported `'none'` (with and without decode
  bounds) right after a resolved `prefetchToDiskCache`. The maintained
  `examples/probes/cached-image.tsrx` asserts `'disk'` there.
