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
| 4 | `recyclingKey` prop — blank the view when a recycled cell's identity changes | **Applied** (adapted — gated on `src` change too) | Medium; kills stale-image flashes on Android platform lists |
| 5 | Placeholders as pipeline loaders (blurhash/thumbhash decode into the same cache/target path) | **Adapt** | Medium; fixes the "placeholder vs final" flicker class |
| 6 | `cachePolicy` as two orthogonal axes (transformed-image cache + original-bytes cache) | **Adapt** | Medium; NS core only exposes `useCache` bool |
| 7 | `contentFit`/`contentPosition` via matrix math, not platform scaleType | **Adapt** | Medium — needed for parity-grade positioning |
| 8 | Multi-`source` array → closest-pixel-count selection (`srcset` for native) | **Portable** | Low-medium; future-facing |
| 9 | Gate per-load events on a JS listener flag (`hasImageLoadedListener`) | **Redundant** — the NS driver model is already listener-gated | None; no unconditional hops exist to remove |
| 10 | `SharedRef`/`useImage`, SF Symbols, `sfEffect`, Live Text, HDR, `webMaxViewportWidth` | **Irrelevant** (confirmed; see verdict note) | Expo/Apple-surface chrome |

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

Lesson for xplat: "prefetch = warm the byte cache, decode at display." NS
core's parallel `ImageCache` module looked usable as the basis for a portable
`Image.prefetch`, but on inspection (`ui/image-cache/index.android.js` in
`@nativescript/core@9.1.2`) it stores completions in its own `LruCache`
instance — it does not feed `org.nativescript.widgets.image.Cache`, the 5 MB
store `<image>` reads. Pushing URIs there warms nothing the view will hit, so
a core `prefetch` would be dishonest; the honest core workaround is mounting
the real `<image>`s early (see
[image-performance](../verify/image-performance.md)).

## L4 — `recyclingKey`

`recyclingKey` setter on Android
(`ExpoImageViewWrapper.recyclingKey.didSet`-equivalent) sets
`clearViewBeforeChangingSource` only when both old and new are non-null and
differ; iOS `recyclingKey.didSet` nils `sdImageView.image` and the cached
placeholder. Semantics: "when list-cell identity changes, show blank/placeholder,
never the previous item's bitmap." Trivially portable — the octane leaf can
clear `src`/`setImageDrawable(null)` on key change before applying the new src.

**Verdict (applied 2026-10-06): applies, adapted.** The flash is real, but only
on one platform and one list kind:

- **List kind.** Only the driver-owned platform lists (`UITableView.ios`,
  `RecyclerView.android`) rebind: `list-view.js bind()` re-renders the same
  cell root ("a diff of the cell's tree — rather than a remount"), so a
  recycled cell's `<image>` survives with its old bitmap. `VirtualList` —
  native, web, and macOS — re-keys pooled rows by `rowKey`, so a rebound row
  unmounts/remounts and gets a fresh, empty image view. `recyclingKey` only
  matters inside `UITableView`/`RecyclerView`.
- **Platform.** iOS already blanks: the shared
  `_createImageSourceFromSrc` sets `imageSource = null` for every string `src`
  (`packages/core/ui/image/image-common`). Android does not —
  `org.nativescript.widgets.ImageView.setUri` clears the bitmap only when the
  URI is *empty*, so a recycled cell keeps drawing the prior item until the
  new fetch resolves (remote `http`, `~/` file, and `res://` srcs all route
  through `setUri`).

**Shipped:** `ImageProps.recyclingKey`; the native `Image` leaf
(`src/Image.tsrx`) clears `view.imageSource` during render when the key changes
between binds *and* `src` differs — the src check skips a pointless
blank-and-reload when a recycled row happens to share the previous item's URL
(expo blanks on key change alone). Clearing during render lands before the
sized binding's ref re-issue of `src`, which starts the new load. Pinned by
`src/image-recycling.mobile.test.ts` (object-driver assertions; the `setUri`
behavior itself is desk-source). Web and macOS leaves ignore the prop by
design — documented on `ImageProps` — because their lists remount keyed rows
rather than rebind a reused host. If the in-flight `@octane-xplat/image` leaf
lands on an engine that retains the previous drawable through a load (Glide's
default), it should honor the same `recyclingKey` prop — the contract is
already public.

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

## Application verdicts (applied 2026-10)

| Lesson | Verdict | Why |
| ------ | ------- | --- |
| L3 prefetch | **Applied in `@octane-xplat/gif`; rejected for core `Image`** | `getImagePipeline().prefetchToDiskCache()` gives the real "bytes on disk, decode at display" semantic on both engines (Fresco disk cache; SDWebImage disk store). Exported as `prefetch(srcs, options?) → Promise<boolean>`; web warms the HTTP cache through a throwaway `<img>`; macOS resolves `false` (no pipeline). Core `Image` was *not* given a prefetch: NS `ImageCache` keeps a private LRU the `<image>` view never reads, so exposing it would promise warmth that never arrives. |
| L4 recyclingKey | **Applied — adapted to the two surfaces that actually need it** | The flash is real only where a recycled host keeps its view *and* the platform keeps its bitmap: `UITableView`/`RecyclerView` cells rebind in place (`bind()` diffs the same tree), and Android `setUri` retains the drawable for non-empty URIs while iOS nulls `imageSource` per string `src`. `ImageProps.recyclingKey` clears the bitmap on key+src change (see the L4 section for evidence and the same-src refinement). `VirtualList`/web/macOS re-key rows instead of rebinding, so they intentionally ignore the prop. |
| L6 cachePolicy | **Adapted — no four-value prop exposed anywhere** | Neither engine surface supports the two orthogonal axes. NS core offers only Android `useCache` (already reachable via `Image`'s `android` escape bag; iOS ignores it). The ui-image `Img` offers a single "bypass" axis (`noCache`: Android evicts the URI then loads; iOS `SDWebImageOptions.FromLoaderOnly`) — still not a per-axis policy. Rather than paper over the missing axes, `AnimatedImage` gained `ios`/`android`/`web` escape bags (the `ImageProps` convention) so `noCache`, `cacheKey`, `decodeWidth`, and friends are reachable as explicitly platform props. |
| L9 listener gating | **Redundant — no unconditional hops exist** | `Image` emits no per-load events, and the universal driver attaches native listeners only for supplied `onX` props — prop presence *is* the listener flag. Keep any future `onLoad`/`onError` prop-gated the same way and carry `cacheType` on the payload. |
| L10 Expo/Apple chrome | **Confirmed irrelevant** | `useImage`/`loadAsync` overlaps the shipped `prefetch` (L3) plus `ImageSource` srcs; SF Symbols already reachable via `sys://` icon names and `iosSymbolEffect`/`iosSymbolScale` through the `ios` escape bag. The rest — `sfEffect`, Live Text, HDR, `useAppleWebpCodec`, web srcset machinery, `decodeFormat` — has no octane contract to express it in. |

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
  **Verdict (2026-10-06): redundant** — there is nothing to gate. `Image`
  emits no load events, and the universal driver only attaches a native
  listener when an `onX` prop is actually supplied (`onX` → `addEventListener`
  in `driver.js`); expo's flag exists because its native module always posts
  to JS and filters client-side. Prop presence *is* the listener flag here.
  If a future image leaf adds `onLoad`/`onError`, keeping them prop-gated is
  the structural default — and put `cacheType` on the payload as noted below.
- **`onLoad` carries `cacheType`** (`none`/`disk`/`memory`) — cheap and very
  useful for perf probes ("did this frame hit memory?").
- **Chrome, skip**: `SharedRef`/`useImage`/`loadAsync`, `sf:` symbols +
  `sfEffect`, `enableLiveTextInteraction`, `preferHighDynamicRange`,
  `useAppleWebpCodec`, `webMaxViewportWidth`/`responsivePolicy` (web-side
  srcset machinery), `decodeFormat: 'rgb'` (RGB_565 — niche memory cut).
  **Verdict (2026-10-06): confirmed irrelevant**, with two footnotes so the
  decision stays informed rather than reflexive. (a) A `useImage`-style
  imperative handle overlaps what we already plan — `Image.prefetch` (L3)
  warms the cache and `ImageSource` instances can pass through `src` — so no
  extra shared API is warranted. (b) SF Symbols aren't entirely absent from
  our surface: `Icon.select` already exposes `sys://` names, and NS core
  `<image>` supports `iosSymbolEffect`/`iosSymbolScale`, reachable through the
  `ios` escape bag if a platform-authentic case ever wants them. The rest —
  `sfEffect` animation sugar, Live Text, HDR, `useAppleWebpCodec`, web-side
  srcset machinery, `decodeFormat` — is Expo/Apple chrome with no octane
  contract to express it in.

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
