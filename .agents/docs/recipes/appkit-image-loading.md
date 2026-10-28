# Load and replace images on AppKit

ID: appkit-image-loading
Targets: macos
Related APIs: Image, @octane-xplat/image, ImageProps, LayoutChildProps

## Starting point

A native AppKit screen previews picked images, displays avatars or reuses the
same image source in a bounded collection. The native Services screen already
previews picked image files.

## Acceptance criteria

- AC1: Render supported local/HTTP(S) sources with meaningful alt text, declared parent-layout props, composed class names and object/inline-CSS styles.
- AC2: Change sources and remove views without stale completion updates; share concurrent loads and release the last subscriber's work. Recognize failure/placeholder behavior and that main-queue processing still permits full-resolution decode stalls.
- AC3: Distinguish the renderer's bounded decoded-image cache from the optional package's unimplemented cache controls and engine extensions; understand source-array, raw CSS position and decode-hint limitations and the separate runtime qualification gate.

- AC4: Compute cover/contain/fill/none/scale-down geometry with keyword, point and percentage positions, clip to the image box, handle flipped/unflipped native coordinates, redraw after size/position changes, and reset removed fit/position styles. Recognize logical-point sizing, raw CSS unit/expression limits and the missing native pixel/orientation qualification.

## Documentation

- AC1: [AppKit image loading](../../../docs/app/components.md#image-loading-on-appkit), [layout regressions](../../../packages/ui/src/image.macos.mobile.test.tsrx) and [maintained probe](../../../examples/probes/image-loading.macos.tsrx).
- AC2: [Renderer image contract](../../../packages/macos-renderer/README.md#render-local-images-and-overlays), [request regressions](../../../packages/macos-renderer/test/image-requests.test.ts) and [remote lifecycle regressions](../../../packages/macos-renderer/test/image-remote.test.ts). These tests are authored, not run; OS networking, threading and cancellation remain unqualified.
- AC3: [Optional-package AppKit subset](../../../packages/image/README.md#appkit-subset), [source qualification limits](../../../docs/testing/known-limits.md#experimental-appkit-renderer) and [target progress](../parity/appkit-progress.md#image-request-lifecycle-and-leaf-normalization). Runtime, layout/pixel, memory/responsiveness and packaged checks remain deferred; cache APIs and engine features are still implementation gaps.

- AC4: [AppKit fit and position](../../../docs/app/components.md#image-loading-on-appkit), [geometry regressions](../../../packages/macos-renderer/test/image-fit.test.ts), [fake drawing/resize regressions](../../../packages/macos-renderer/test/image-drawing.test.ts), [style-removal regressions](../../../packages/macos-renderer/test/style-reconcile.test.ts) and [maintained fit probe](../../../examples/probes/image-fit.macos.tsrx). Tests, native drawing, resize/orientation/density and pixel checks have not run; visual analysis remains unauthorized.

- AC3: [Resolution candidate selection](../../../docs/app/components.md#image-loading-on-appkit), [geometry callback regressions](../../../packages/macos-renderer/test/image-geometry.test.ts) and [component selection regressions](../../../packages/ui/src/image.macos.mobile.test.tsrx) cover source selection as a source contract. Native resize/screen transfer, density, intrinsic-only sizing and packaging remain unqualified; tests have not run.
