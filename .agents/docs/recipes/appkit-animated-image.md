# Show an animated illustration on AppKit

ID: appkit-animated-image
Targets: macos
Related APIs: @octane-xplat/gif, AnimatedImage, AnimatedImageProps, prefetch

## Starting point

A shared gallery or onboarding screen needs a small animated illustration.
Core Image is a static image path; the optional GIF package owns animation.

## Acceptance criteria

- AC1: Declare the package and rebuild its native NSImageView bridge. Avoid mobile-plugin imports at the AppKit leaf, preserve shared props and document missing-bridge failure and explicit sizing.
- AC2: Source paths cover HTTP(S), file/data and bundle resources, native frame timing, four centered fit modes, current alt text and reduced-motion/hidden/detached behavior. Keep GIF/WebP/OS-format and frame/loop/AX qualification separate from source presence.
- AC3: Replacement clears old images and cancels remote work, stale completions cannot install, unchanged props preserve playback, reentry cannot restore an older surface, and unmount releases the image/request/settings observer. File/data reads already started can finish but must be ignored after retirement.
- AC4: State that shared prefetch remains false and engine options/headers/mobile escape bags are outside this subset. Maintain meaningful owner cases and an idle manual fixture. Separate syntax/SDK/manifest evidence from tests/typegen/builds/Swift/native playback, network/ATS/sandbox and clean native packaged-consumer proof.

## Documentation

- AC1–AC4: [Package subset](../../../packages/gif/README.md#experimental-appkit-subset), Octane primitive reference, shared demo and [target note](../exploration.md#operational-evidence).
- AC3–AC4: Six [ownership cases](../../../packages/gif/tests/animated-image-owner.macos.test.ts) and [manual fixture](../../../examples/probes/animated-image.macos.tsrx), all unrun. Existing packed suite checks declarations and cannot prove native animation.
