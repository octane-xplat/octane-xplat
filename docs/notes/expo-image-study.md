# What octane-xplat can learn from expo-image (SDK 57)

> Desk-source audit of `expo/expo` branch `sdk-57`, `packages/expo-image`
> (fetched via opensrc; Glide 4.x + OkHttp integration on Android, SDWebImage
> on iOS). Evidence type: `desk-source` throughout — nothing was run.
> Octane baseline checked against `NativeScript/NativeScript@main`
> (`packages/core/ui/image`, `packages/ui-mobile-base/.../image/Fetcher.java`,
> `image/Cache.java`, `image/Worker.java`) and `@nativescript-community/ui-image`
> `master`.

Context: the feed perf work named the image pipeline as the suspect for
Android scroll jank (decode-to-target-size and placeholder behavior). That
suspicion is well-founded — see L1/L2. For the operational version of these
findings — symptoms, profiling steps, and fixes an app can apply today — see
[Debug native image performance](../verify/image-performance.md).

## Ranked lessons

| # | Lesson | Verdict | Expected impact |
| - | ------ | ------- | --------------- |
| 1 | Decode to the laid-out view size, not the source size | **Adapt** (NS already supports it; we don't use it) | High — this is very likely the feed-jank fix |
| 2 | A real memory cache (bitmap pool + sized LRU), not NS's 5 MB `LruCache` | **Adapt** (needs Glide/SDWebImage leaf or tuning `useCache`) | High — cache misses mid-scroll = re-decode = jank |
| 3 | `prefetch()` that warms the *byte/disk* cache, decode deferred to display | **Portable** | High for feed warmup |
| 4 | `recyclingKey` prop — blank the view when a recycled cell's identity changes | **Portable** | Medium; kills stale-image flashes in lists |
| 5 | Placeholders as pipeline loaders (blurhash/thumbhash decode into the same cache/target path) | **Adapt** | Medium; fixes the "placeholder vs final" flicker class |
| 6 | `cachePolicy` as two orthogonal axes (transformed-image cache + original-bytes cache) | **Adapt** | Medium; NS core only exposes `useCache` bool |
| 7 | `contentFit`/`contentPosition` via matrix math, not platform scaleType | **Adapt** | Medium — needed for parity-grade positioning |
| 8 | Multi-`source` array → closest-pixel-count selection (`srcset` for native) | **Portable** | Low-medium; future-facing |
| 9 | Gate per-load events on a JS listener flag (`hasImageLoadedListener`) | **Portable** | Low; cheap bridge-hop win |
| 10 | `SharedRef`/`useImage`, SF Symbols, `sfEffect`, Live Text, HDR, `webMaxViewportWidth` | **Irrelevant** | Expo/Apple-surface chrome |

## L1 — decode to view size (the headliner)

expo-image never decodes a source larger than the view it will occupy:

- **Android.** The Glide target (`ImageViewWrapperTarget.getSize`) reports the
  view's *laid-out* size through a copied `SizeDeterminer` that waits for
  layout before letting the request start — decode doesn't begin until the
  view size is known. A custom `DownsampleStrategy` then computes the scale
  factor from the contentFit math
  (`ContentFitDownsampleStrategy.getScaleFactor`: `min(1, requested/source)`,
  `SampleSizeRounding.QUALITY`), so `inSampleSize` sampling targets view
  pixels, and `onSizeChanged` re-runs the load when the view resizes
  (`ExpoImageViewWrapper.rerenderIfNeeded`, gated on `allowDownscaling` and
  `contentFit ∉ {fill, none}`). `SafeDownsampleStrategy` additionally caps
  decode at the hardware bitmap limit (~100 MB, read from
  `ro.hwui.max_texture_allocation_size`).
- **iOS.** Post-load, `processImage`/`shouldDownscale`/`resize`
  (`ios/ImageView.swift`, `ios/Utils/ImageUtils.swift`) redraw the image at
  `idealSize` only when the decoded image exceeds view pixels — never upscale.
  `enforceEarlyResizing` pushes this into decode via SDWebImage's
  `imageThumbnailPixelSize` context; animated images get a per-frame
  `SDImageResizingTransformer` as `animationTransformer`.
  `bounds.didSet` → `reload()` mirrors the Android resize reload.

**Octane today:** `Image.tsrx` passes `src` straight to `<image>`. NS core
Android then calls `imageView.setUri(value, decodeWidth, decodeHeight, …)`
where `decodeWidth`/`decodeHeight` default to **0** →
`Fetcher.calculateInSampleSize` maps `reqWidth ≤ 0` to the source dims →
`inSampleSize = 1` → **full-resolution decode** (`packages/core/ui/image/
index.android.ts` `_createImageSourceFromSrc`;
`ui-mobile-base/.../image/Fetcher.java`). A feed of 12 MP photos decodes each
at ~48 MB ARGB_8888. That alone explains scroll jank and GC churn.

**Cheap path:** NS `<image>` already takes `decodeWidth`/`decodeHeight` — the
octane leaf can defer `src` assignment until first layout, convert measured
view size to device pixels, and set both. No plugin needed for the basic win.
**Caveat:** NS applies decode dims at `setUri` time, so size-changes need an
explicit reload hook — same re-trigger expo-image does in `onSizeChanged`.

## L2 — memory cache adequacy

NS's pipeline (`org.nativescript.widgets.image.Cache`) is a
`LruCache<String, Bitmap>` defaulting to **5 MB**
(`DEFAULT_MEM_CACHE_SIZE = 1024 * 5`) plus a 10 MB `DiskLruCache` for HTTP
bytes, and a bitmap-reuse pool gated on `useCache`. 5 MB holds one or two
decoded feed images; scrolling evicts entries still on screen → re-decode
mid-scroll → jank. Glide's defaults (fraction-of-heap LRU + active-resource
table + `BitmapPool` reuse so decode doesn't allocate) are precisely what a
feed wants. expo-image adds nothing here except *using* Glide — the lesson is
that the engine choice is the fix, and `@nativescript-community/ui-image`
already bundles **Glide + glide-transformations + okhttp3-integration on
Android and SDWebImage ≥5.21.3 on iOS** (`packages/image/platforms/android/
include.gradle`, `platforms/ios/Podfile`) — the same engines expo-image wraps.
Per our rules this ships as a leaf package (`@octane-xplat/image`), not in
`packages/ui`.

## L3 — prefetch semantics

`Image.prefetch(urls, cachePolicy, headers)` (`src/Image.tsx`) resolves
`false` on the first failure. The interesting part is what each platform warms:

- **iOS** (`ImageModule.swift` prefetch): `queryCacheType`/`storeCacheType`
  (transformed image) are forced to `.none`; `originalQuery/StoreCacheType`
  (raw bytes) get the requested policy. So prefetch warms **encoded bytes on
  disk only** — decode cost stays at display time.
- **Android** (`ExpoImageModule.kt` prefetch): `Glide.load(...).submit()` with
  `.encodeQuality(100).downsample(NoopDownsampleStrategy)` — deliberately run
  through the load path to share cache keys with display. Note the prefetch
  downsample key (`NoopDownsampleStrategy`) differs from the display key
  (`ContentFitDownsampleStrategy`, whose `equals` collapses all
  `CustomDownsampleStrategy` instances — a deliberate fixed-hashCode trick so
  Glide memory-caches across dynamic strategy instances). Prefetch therefore
  reliably warms Glide's *data* disk cache; the transformed memory entry is
  keyed differently and won't be hit by the display load.

Lesson for xplat: "prefetch = warm the byte cache, decode at display." NS core
has a parallel but weaker `ImageCache` module (push/enqueue queue,
`maxRequests = 5`, per-key completed callbacks) usable as the web-of-trust for
a portable `Image.prefetch`.

## L4 — `recyclingKey`

`recyclingKey` setter on Android
(`ExpoImageViewWrapper.recyclingKey.didSet`-equivalent) sets
`clearViewBeforeChangingSource` only when both old and new are non-null and
differ; iOS `recyclingKey.didSet` nils `sdImageView.image` and the cached
placeholder. Semantics: "when list-cell identity changes, show blank/placeholder,
never the previous item's bitmap." Trivially portable — the octane leaf can
clear `src`/`setImageDrawable(null)` on key change before applying the new src.

## L5 — placeholders as pipeline citizens

blurhash/thumbhash are not side-channels: they're **registered loaders in the
same engine** — Glide `ModelLoader`s (`blurhash/BlurhashModelLoader.kt` →
`BlurHashFetcher` → `BlurhashDecoder`; same for thumbhash), and SDWebImage
`SDImageLoader`s (`ios/Loaders/BlurhashLoader.swift` etc.) dispatched by URI
scheme (`blurhash:/`, `thumbhash:/`, plus `sf:/` and Photos assets). Benefits:
placeholder decode rides the same cache keys, targets, and lifecycle; a hash
placeholder gets `usesPlaceholderContentFit() = false` so it renders with the
final `contentFit` (avoids the scale mismatch flicker the prop docs warn
about). Decoders are ~100 lines of pure math and port directly; wiring them
*behind the image pipeline* is the structural idea worth copying, even if the
xplat v1 implementation just decodes a hash to an `ImageSource` in JS/native
and crossfades it in the shared layer.

## L6 — `cachePolicy` shape

`'none' | 'disk' | 'memory' | 'memory-disk'` is really two booleans:

- Android (`createPropOptions`): skip memory cache unless `memory`/`memory-disk`;
  `DiskCacheStrategy.NONE` for `none`/`memory`.
- iOS (`createSDWebImageContext`): the policy sets **both** the transformed
  (`query/storeCacheType`) and original-bytes (`originalQuery/storeCacheType`)
  cache types — except photo-library assets, which never cache originals.

Worth adopting the four-value prop even if NS v1 only honors the memory axis.
`configureCache` (iOS-only: `maxDiskSize`/`maxMemoryCount`/`maxMemoryCost`)
shows the pressure-release API shape if we ever need it.

## L7 — fit/position via matrix

Android's inner `ExpoImageView` uses `ScaleType.MATRIX` and computes the fit
matrix itself (`contentFit.toMatrix` + `contentPosition.apply`), so cover/
contain/scale-down and arbitrary `object-position` share one code path across
placeholder and final. iOS does it with `contentMode` + layer-frame offset in
`applyContentPosition`. NS `stretch` (`aspectFit`/`aspectFill`/`fill`/`none`)
covers the fits but has no position control; a `contentPosition` prop would
need the matrix approach on Android (`setImageMatrix`) — `scaleType` alone
can't express it.

## L8–L10 — smaller lessons

- **Best-source selection** (`getBestSource` on both platforms): for a
  `source` array, pick the source whose `width*height*scale²` is closest to
  the view's pixel count. Pure TS, directly portable; pairs with per-source
  `width`/`height`/`scale` fields in `ImageSource`.
- **Event gating**: `hasImageLoadedListener` (both modules) skips the
  per-image-load bridge hop when no one subscribes `imageLoaded`. Same win
  applies to any per-load callback we'd emit through NS marshaling.
- **`onLoad` carries `cacheType`** (`none`/`disk`/`memory`) — cheap and very
  useful for perf probes ("did this frame hit memory?").
- **Chrome, skip**: `SharedRef`/`useImage`/`loadAsync`, `sf:` symbols +
  `sfEffect`, `enableLiveTextInteraction`, `preferHighDynamicRange`,
  `useAppleWebpCodec`, `webMaxViewportWidth`/`responsivePolicy` (web-side
  srcset machinery), `decodeFormat: 'rgb'` (RGB_565 — niche memory cut).

## NativeScript feasibility

Not reusable as code: everything native sits on `ExpoView`/`AppContext`/
`Record` marshaling. But the *architecture* has no RN-only dependency — the
image view is prop-in/drawable-out over Glide and SDWebImage, which is exactly
the shape of a NS plugin:

- **Direct port**: NS core `decodeWidth/decodeHeight` + `useCache` +
  `loadMode='async'` cover L1/L2's basic shape. `ImageCache` module ≈ weak
  prefetch.
- **Adapt via plugin**: `@nativescript-community/ui-image` (Glide+SDWebImage,
  `placeholderImageUri`, `progressiveRenderingEnabled`, `decodeWidth/Height`,
  custom headers, crossfade transition factory, matrix-drawable contentFit) is
  the same engine stack; per decision #53 it would ship as
  `@octane-xplat/image`, a leaf depending on the plugin. Verify the plugin's
  maintenance/typings before committing — the `master` checkout showed
  platform/native sources but the npm-facing TS surface needs an audit.
- **Adapt via own leaf**: Glide/SDWebImage are callable through NS Java/ObjC
  interop directly; a thin custom view implementing target-size decode +
  placeholder + crossfade (the `ExpoImageViewWrapper` design, ~600 lines of
  Kotlin) is feasible without the community plugin.
- **Irrelevant**: ExpoModulesCore records, `SharedRef`, autolinking/config
  plugins, JSI — none of it is load-bearing for the image pipeline itself.

## Suggested follow-ups

1. Probe: measure jank delta on the probe app feed with `decodeWidth`/
   `decodeHeight` set from laid-out view size vs. today (lab-experiment).
2. Prototype a `@octane-xplat/image` leaf on `@nativescript-community/ui-image`
   vs. a custom Glide-backed view; compare API fit (`contentFit`,
   `recyclingKey`, `placeholder`, `prefetch`).
3. Decide whether `ImageProps` grows `contentFit`, `placeholder`, `cachePolicy`,
   `recyclingKey`, `priority`, `transition` — and which are shared vs
   `.mobile`-only given `packages/ui` parity rules.
