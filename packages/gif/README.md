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

Per-target limits are recorded in
[known limits](../../docs/verify/known-limits.md). Exercised by
[`AnimatedImageDemo`](../demos/src/AnimatedImageDemo.tsrx).
