# Load and replace images on AppKit

ID: appkit-image-loading
Targets: macos
Related APIs: Image, @octane-xplat/image, ImageProps, LayoutChildProps

## Starting point

A native AppKit screen previews picked images, displays avatars or reuses the
same image source in a bounded collection. The native Services screen already
previews picked image files.

## Acceptance criteria

- AC1: Render supported local/HTTP(S) sources with meaningful alt text, declared parent-layout props, composed class names and object/inline-CSS styles. Use contain-fit when the incomplete cover behavior matters.
- AC2: Change sources and remove views without stale completion updates; share concurrent loads and release the last subscriber's work. Recognize failure/placeholder behavior and that main-queue processing still permits full-resolution decode stalls.
- AC3: Distinguish the renderer's bounded decoded-image cache from the optional package's unimplemented cache controls and engine extensions; understand source-array, position, cover and decode-hint limitations and the separate runtime qualification gate.

## Documentation

- AC1: [AppKit image loading](../../../docs/app/components.md#image-loading-on-appkit), [layout regressions](../../../packages/ui/src/image.macos.mobile.test.tsrx) and [maintained probe](../../../examples/probes/image-loading.macos.tsrx).
- AC2: [Renderer image contract](../../../packages/macos-renderer/README.md#render-local-images-and-overlays), [request regressions](../../../packages/macos-renderer/test/image-requests.test.ts) and [remote lifecycle regressions](../../../packages/macos-renderer/test/image-remote.test.ts). These tests are authored, not run; OS networking, threading and cancellation remain unqualified.
- AC3: [Optional-package AppKit subset](../../../packages/image/README.md#appkit-subset), [source qualification limits](../../../docs/testing/known-limits.md#experimental-appkit-renderer) and [target progress](../parity/appkit-progress.md#image-request-lifecycle-and-leaf-normalization). Runtime, layout/pixel, memory/responsiveness and packaged checks remain deferred; cache APIs and engine features are still implementation gaps.
