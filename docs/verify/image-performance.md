# Debug native image performance

> Diagnose scroll jank, memory spikes, and slow-loading images on iOS and
> Android.

When a screen full of images scrolls smoothly in the browser but stutters on a
phone, suspect the image pipeline before your own code. On Android, every
`<image>` decodes the whole source photo at full resolution by default — a 12
megapixel camera photo becomes a ~48 MB bitmap even when it fills a thumbnail.
This guide explains what the pipeline does, how to prove it is the problem, and
the fixes from smallest to largest. It is written for people and coding agents.

The mechanism below was verified by reading the NativeScript source
(`desk-source`), not measured on a device — the profiling steps are how you
collect the runtime evidence for your app. The [expo-image
study](../notes/expo-image-study.md) compares this pipeline to expo-image and
is the background record for the advice here.

## When to suspect the image pipeline

Check these before profiling. Each is a sign that image decode, not layout or
JS work, is costing the frames:

- Jank appears while scrolling a view that shows images, and gets worse with
  higher-resolution photos — even though the views themselves are small.
- The same screen scrolls smoothly in the browser. Web `<img>` elements decode
  at rendered size and browsers cache decoded bitmaps; the native path does
  neither by default.
- Memory climbs steeply during scroll, then drops in bursts — a sawtooth heap
  caused by repeated large bitmap allocations and garbage collection.
- Images flicker or fade back in when scrolling back up over items that were
  already visible — decoded bitmaps were evicted and are being decoded again.
- The app is killed by the OS, or slows down globally, after browsing
  image-heavy screens.
- On Android, `adb logcat` shows fresh decode work for the same URIs on each
  scroll pass (see [Watch cache hits](#watch-cache-hits-on-android) below).

Signs to look elsewhere: the same jank happens on web (shared JS or layout
work is more likely), screens with no images stutter too, or the screen is
slow only on first paint rather than while scrolling.

## What the pipeline does with your image

The shared `Image` component ([`packages/ui/src/Image.tsrx`](../../packages/ui/src/Image.tsrx))
renders a NativeScript `<image>` element; on web
([`Image.web.tsrx`](../../packages/ui/src/Image.web.tsrx)) it is a plain
`<img>`. `ImageProps` in [`packages/ui/src/props.ts`](../../packages/ui/src/props.ts)
exposes only `src` and `alt` — no decode or cache controls.

On Android, assigning `src` reaches
`_createImageSourceFromSrc` in NS core's `packages/core/ui/image/index.android.ts`,
which calls the native view:

```ts
imageView.setUri(value, decodeWidth, decodeHeight, keepAspectRatio, this.useCache, async)
```

`decodeWidth` and `decodeHeight` are declared on `ImageBase`
(`packages/core/ui/image/image-common.ts`) with a default of `0`, and nothing
in the Xplat leaf sets them. Inside
`packages/ui-mobile-base/android/widgets/src/main/java/org/nativescript/widgets/image/Fetcher.java`,
`calculateInSampleSize` maps a requested size of `0` or less back to the
source dimensions, so `inSampleSize` stays `1` — a full-resolution decode.
Bitmaps are 4 bytes per pixel (`ARGB_8888`), so the cost is the source pixel
count, not the view size:

| Source | View it fills | Decoded size by default | Needed for the view |
| ------ | ------------- | ----------------------- | ------------------- |
| 4032×3024 (12 MP) photo | 96×72 dip thumbnail on a 3× screen | ~48.8 MB | ~0.25 MB (288×216 px) |

(“Dip” is device-independent pixels — the unit layout uses. A 3× screen turns
96 dip into 288 real pixels, and the decoder wants real pixels.)

Decoded bitmaps go into `org.nativescript.widgets.image.Cache`
(`.../image/Cache.java`): an `LruCache` sized at 5 MB
(`DEFAULT_MEM_CACHE_SIZE = 1024 * 5`), plus a 10 MB `DiskLruCache` for HTTP
bytes (`HTTP_CACHE_SIZE` in `Fetcher.java`). Five megabytes cannot hold even
one 48 MB bitmap, so every new decode evicts the others — scrolling back over
an image means decoding it again. A bitmap-reuse pool reduces allocation when
`useCache` is on, but it does not grow the cache.

On iOS the same default applies by a different mechanism: `ImageSource` loads
the `UIImage` at source size and `UIImageView` scales it for display via
`contentMode`. `decodeWidth`/`decodeHeight` exist on `ImageBase` but the iOS
`_createImageSourceFromSrc` (in `image-common.ts`) never reads them — they are
Android-only in practice.

## Confirm the pipeline is the problem

### Compare expected and observed bitmap size

Work out what one image *should* cost: view size in dip × screen scale × 4
bytes. A 96×72 dip thumbnail on a 3× Android screen should cost about
`96 * 3 * 72 * 3 * 4` ≈ 250 KB. If the profiler shows tens of megabytes per
image, the app is over-decoding.

- **Android:** Android Studio → Profiler → Memory, or
  `adb shell dumpsys meminfo <your.package>` — watch the Graphics/bitmap rows
  while scrolling.
- **iOS:** Xcode's memory gauge while scrolling, or Instruments → Allocations —
  look for large `CGImage`/image allocations that track source resolution.

### Watch cache hits on Android

The Fetcher/Cache/Worker classes log under the logcat tag `JS` when you set a
meta-data flag in `App_Resources/Android/src/main/AndroidManifest.xml`:

```xml
<application ...>
	<meta-data android:name="debugImageCache" android:value="true" />
</application>
```

Then run and scroll:

```sh
adb logcat -s JS:V
```

Healthy output while re-scrolling shows `Memory cache hit` and no new
`loadImage`/`doInBackground - starting work` lines. Unhealthy output shows
`doInBackground - starting work` (and, for remote images, `processBitmap, not
found in http cache, downloading...`) again for URIs that were already on
screen — the 5 MB cache evicted them mid-scroll.

### Check whether anything sets a decode size

```sh
grep -rn "decodeWidth\|decodeHeight" src/
```

Nothing in `packages/ui` sets these props. Unless app code passes them through
the platform escape bag (below), every native `<image>` decodes at full source
resolution.

### Healthy vs unhealthy at a glance

| Signal | Healthy | Over-decoding |
| ------ | ------- | ------------- |
| Memory per image in a list | ~ view pixels × 4 B (often < 1 MB) | Source pixels × 4 B (tens of MB) |
| Heap shape during scroll | Plateaus after initial loads | Sawtooth: climbs then GC drops |
| Scrolling back over an item | Instant, `Memory cache hit` | Re-decode, blank/fade-in, new `loadImage` log |
| Jank vs photo resolution | Independent of source size | Worse with bigger source files |

## Remedies

Ordered roughly by effort. Each fits a different situation — pick the smallest
change that matches your app's constraints rather than stacking them all.

### Pass `decodeWidth`/`decodeHeight` (Android)

NS `<image>` already takes both props; the Xplat leaf just doesn't forward
them. `ImageProps` carries an `android` escape bag that is assigned onto the
native view after the shared props, so you can set them today. Values are
**dip** (a plain number is dip; pass a string like `'288px'` for raw pixels):

```tsx
import { Image } from '@octane-xplat/ui'

;<Image
	src={photo.url}
	alt={photo.caption}
	android={{ decodeWidth: 96, decodeHeight: 96 }}
/>
```

This is the right tool when the display size is a constant you know — a fixed
avatar or thumbnail size. Tradeoffs:

- The dims are read when `src` is applied (`setUri` time). If the view's size
  changes later, nothing re-decodes — you'd get a low-res bitmap in a bigger
  view until `src` is re-assigned.
- Values are capped at the screen's pixel dimensions.
- They only apply to file/resource/URL srcs routed through `setUri`. `data:`
  URIs and font-icon URIs take the shared path that ignores decode dims.
- iOS ignores both props, and this does nothing for the 5 MB memory cache —
  see the engine option below if cache misses are your main cost.

### Defer `src` until the view has a size

When the display size depends on layout, measure the container first and only
attach `src` once you know it. [`useMeasure`](../../packages/ui/src/useMeasure.tsrx)
returns bounds in dip, which is exactly the unit `decodeWidth` expects:

```tsx
import { Image, View, useMeasure } from '@octane-xplat/ui'

export function FeedPhoto(props: { src: string; alt?: string }) {
	const box = useMeasure({ observe: false })
	const size = box.bounds
	return (
		<View ref={box.ref} className="feed-photo">
			{size && (
				<Image
					src={props.src}
					alt={props.alt}
					android={{
						decodeWidth: size.width,
						decodeHeight: size.height,
						loadMode: 'async',
					}}
				/>
			)}
		</View>
	)
}
```

This is the pattern expo-image uses internally — wait for layout, then decode
to the laid-out size. Tradeoffs: images render one layout pass late, so pair
it with a `Skeleton` or background color; `{observe: false}` avoids re-decoding
on every layout shift but means a genuinely resized image keeps its original
decode size until `src` changes.

### Move decode off the UI thread

NS `loadMode` defaults to `'sync'` for file/resource/data srcs — decode runs
on the UI thread. Setting it to `'async'` moves the work to a worker:

```tsx
<Image
	src="~/images/hero.jpg"
	alt="Header"
	ios={{ loadMode: 'async' }}
	android={{ loadMode: 'async' }}
/>
```

Remote URL srcs are always loaded async regardless of this prop. Async
loading doesn't shrink the decode — it just stops the decode from blocking a
frame. Expect images to appear slightly later; combine with a placeholder.

### Warm the image before it scrolls on screen

Prefetching means doing the network work early so display time is cheap. On
stock NS the tools are weak: the `ImageCache` module
(`packages/core/ui/image-cache`, `maxRequests = 5`) is a standalone queue with
its own LRU store — it does not feed the 5 MB cache the `<image>` view reads,
so pushing URIs there does not make `<image>` display any faster. The honest
prefetch on core is to mount the real `<image>` elements early — for example
rendering the next screen's images inside a zero-height `View` while the
current screen is up:

```css
.prefetch-bin {
	height: 0;
	overflow: hidden;
}
```

```tsx
import { Image, View } from '@octane-xplat/ui'

;<View className="prefetch-bin">
	{upcoming.map((photo) => (
		<Image key={photo.id} src={photo.url} alt="" />
	))}
</View>
```

This warms the HTTP disk cache and (while entries survive) the memory cache —
but the same 5 MB ceiling applies, and each prefetch still decodes at full
size unless you also set decode dims. If your feed needs real prefetch —
bytes early, decode at display — that is a property of the engine, which
leads to the next option. (`@octane-xplat/gif` already exports a `prefetch`
helper that does this on the ui-image pipeline; see the engine option below.)

### Bring in a real image engine

If cache misses and over-decode persist after the cheap fixes, the pipeline
itself is the limit. `@nativescript-community/ui-image` wraps a real image
engine — Glide on recent versions (Fresco in the 4.x line the repo pins),
SDWebImage on iOS, the same class of engines expo-image uses. You get a
heap-fraction memory cache instead of a fixed 5 MB, a bitmap pool so decode
doesn't allocate, a real disk cache, placeholders, `decodeWidth`/`decodeHeight`
props, and prefetch APIs. The repo already uses it: `@octane-xplat/gif`'s
`AnimatedImage` ([`packages/gif/src/AnimatedImage.tsrx`](../../packages/gif/src/AnimatedImage.tsrx))
registers its `Img` element:

```tsx
import { registerElement } from '@nativescript-community/octane'
import { Img } from '@nativescript-community/ui-image'

registerElement('feedimage', Img)
```

The gif leaf also re-exports two of the plugin's tools without registering
your own element: `prefetch(urls)` warms the engine's disk cache ahead of
display (the "bytes early, decode later" contract), and `AnimatedImage`'s
`ios`/`android` escape bags reach the `Img` prop surface — `noCache`,
`decodeWidth`/`decodeHeight`, `placeholderImageUri`, and friends:

```tsx
import { prefetch } from '@octane-xplat/gif'

await prefetch(nextScreen.map((photo) => photo.url))
```

Costs to weigh: it is a different element, not a prop on `Image`, so the
shared parity contract has to be re-established in a leaf package
(`packages/ui` takes no new dependencies — the framework's plan, per the
expo-image study, is an eventual `@octane-xplat/image` leaf that does not
exist yet). The study also flagged that the plugin's npm-facing TypeScript
surface needs an audit before committing to it for static images.

### iOS specifics

`decodeWidth`/`decodeHeight` do nothing on iOS — `image-common.ts` declares
them but the iOS load path ignores them, and the `UIImage` is kept at source
size behind the `UIImageView`'s `contentMode` scaling. If iOS profiling shows
the same pattern (large `CGImage` allocations, jank on scroll-back), the
current answer is the community plugin above — its `Img` element takes
`decodeWidth`/`decodeHeight` on both platforms and caches decoded results.
The shared `Image` prop is `src: string`, so there is no way today to hand it
a pre-downscaled `ImageSource` from app code; shrinking the source file or
the plugin path are the working options.

## See also

- [expo-image study](../notes/expo-image-study.md) — the evidence this guide
  is based on: decode-to-view-size, cache sizing, prefetch semantics, and the
  leaf-package plan.
- [Known limits](known-limits.md) — per-platform behavior tables, including
  animated raster (`Image` is single-frame; `AnimatedImage` covers GIF/webp).
- [Probe one platform case](probing.md) — the repo-local runner for isolating a
  reproduction in the harness.
