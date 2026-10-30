# `@octane-xplat/gif`

Animated images (GIF, animated WebP) for Octane xplat apps: a plain
`<img>` on web and `@nativescript-community/ui-image`
(Fresco on Android / SDWebImage on iOS) on mobile. AppKit has an experimental
NSImageView source implementation; native compilation and playback remain unqualified.

```sh
bun add @octane-xplat/gif
```

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
animations use [`@octane-xplat/lottie`](https://github.com/octane-xplat/octane-xplat/blob/main/packages/lottie/README.md) instead.

## Prefetch

`prefetch` warms the image engine's disk cache for URLs you expect to show
soon — bytes on disk now, decode still at display time:

```tsx
import { prefetch } from '@octane-xplat/gif'

await prefetch(feed.map((post) => post.imageUrl)) // false if any URL fails

await prefetch(urls, {
	headers: { Authorization: 'Bearer …' }, // Android only — see below
	concurrency: 5, // max parallel fetches (default)
})
```

On Android that is Fresco's `prefetchToDiskCache`; on iOS, SDWebImage's
prefetcher storing to disk. On web it loads each URL through a throwaway
`<img>` so the browser HTTP cache is warm. It resolves `false` when any URL
fails — and always `false` on macOS, where no shared animated-image prefetch
cache is implemented. Same contract as `@octane-xplat/image`'s `prefetch`.

Options: `headers` is forwarded to the engine — **honored on Android,
dropped on iOS** (the plugin's prefetch path lacks the request-modifier
branch its display path has; an upstream patch is needed) — and ignored on
web. `concurrency` caps parallel fetches JS-side (default 5).

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
[known limits](https://octane-xplat.goddardai.org/known-limits). Exercised by
[`AnimatedImageDemo`](https://github.com/octane-xplat/octane-xplat/blob/main/packages/demos/src/AnimatedImageDemo.tsrx).

## Experimental AppKit subset

Declare this package in the app and rebuild the native host so its Swift class
is discovered. The AppKit entry avoids importing the mobile image plugin. Give
the image an explicit size for predictable layout. Missing bridge discovery
throws with rebuild guidance instead of displaying an unsupported label.

```tsx
import { AnimatedImage } from '@octane-xplat/gif'
export function LoadingIllustration() {
	return <AnimatedImage src="~/loading.gif" alt="Loading illustration"
		width={160} height={120} stretch="aspectFit" />
}
```

The native source loads HTTP(S), absolute files, file URLs, data URIs and
`~/` bundle-relative resources. NSImage decodes and NSImageView owns GIF timing;
there is no JavaScript frame timer. Animated WebP and other formats depend on
the installed macOS decoder and remain unqualified. All four stretch modes
have centered geometry paths; aspectFill clips to the host. Source changes
clear the old image, cancel remote work and reject stale completions. Failure
leaves an empty surface; the shared API has no load/error callbacks.

```tsx
<AnimatedImage src="https://example.com/illustration.gif" alt="Illustration"
	width={240} height={140} stretch="aspectFill" />
```

Unchanged props preserve playback. Detachment/hidden ancestors and reduced
motion disable animation, and unmount releases the image, request and display
settings observer. Reduced motion pauses progression; a particular still frame
is not promised. Empty alt text hides the surface from accessibility; a nonempty
alt labels the native image. HTTP uses an ephemeral session without persistent
cache, cookie or credential storage. Custom headers, decode bounds, transitions,
mobile/web escape bags and a shared GIF prefetch cache are not implemented here.

```ts
import { prefetch } from '@octane-xplat/gif'
await prefetch('https://example.com/illustration.gif') // false on AppKit
```

Six ownership cases and an idle [manual fixture](../../examples/probes/animated-image.macos.tsrx)
are authored, all unrun. Native Swift/class discovery, decoding/frame progression,
fit/clipping/layout, source/hidden/window lifetimes, reduced motion, network/ATS/
sandbox, VoiceOver and clean native packaged consumers remain unqualified.
The existing packed test checks declarations, not actual AppKit animation.
