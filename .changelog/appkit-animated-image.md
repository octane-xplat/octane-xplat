### Animated image source path on AppKit

The optional GIF package now has an experimental native NSImageView path for
animated illustrations on AppKit. Add the package, rebuild the native host and
give the image a size. Native compilation, GIF playback and packaged consumers
remain unqualified; animated WebP depends on the macOS decoder.

```tsx
import { AnimatedImage } from '@octane-xplat/gif'
<AnimatedImage src="~/loading.gif" alt="Loading illustration" width={160} height={120} />
```

Reduced motion stops frame progression. AppKit prefetch still resolves false.
See the [AppKit subset](https://github.com/octane-xplat/octane-xplat/tree/main/packages/gif#experimental-appkit-subset).
