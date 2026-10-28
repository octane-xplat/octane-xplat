# Load and replace images on AppKit

ID: appkit-image-loading
Targets: macos
Related APIs: Image, @octane-xplat/image, ImageProps, LayoutChildProps, cachePolicy

## Starting point

A native AppKit screen previews picked images, displays avatars or reuses the
same image source in a bounded collection. The native Services screen already
previews picked image files.

## Acceptance criteria

- AC1: Render supported local/HTTP(S) sources with meaningful alt text, declared parent-layout props, composed class names and object/inline-CSS styles.
- AC2: Change sources and remove views without stale completion updates; share concurrent loads and release the last subscriber's work. Recognize failure/placeholder behavior and that main-queue processing still permits full-resolution decode stalls.
- AC3: Distinguish the renderer's bounded decoded-image cache from the optional package's image-owned byte-cache subset and unimplemented engine extensions; understand source-array, raw CSS position and decode-hint limitations and the separate runtime qualification gate.

- AC4: Compute cover/contain/fill/none/scale-down geometry with keyword, point and percentage positions, clip to the image box, handle flipped/unflipped native coordinates, redraw after size/position changes, and reset removed fit/position styles. Recognize logical-point sizing, raw CSS unit/expression limits and the missing native pixel/orientation qualification.

- AC5: Provide private decoded-memory probe/evict/clear controls without claiming public memory+disk support. Invalidation retires old cache writes and shared work for later subscribers while preserving current view deliveries and final-subscriber cancellation. Reject stale/duplicate completions; keep probes independent of recency, mounted pixels and HTTP/disk cache state.

- AC6: Connect default public AppKit initialize/prefetch/query/evict/clear to the same image-owned byte backend as display. Warm HTTP(S) bytes without decode, distinguish decoded memory from disk/none, honor batch concurrency and retire old disk writers on invalidation while preserving mounted delivery. Keep unrelated HTTP caches separate, permit display when disk is unavailable, reject unsupported/protected storage and configuration/header/transform claims, bind public declaration types and keep actual native/persistence/packaging gates explicit.

- AC7: Honor optional Image cachePolicy="none" through a per-view private handoff without changing public UI Image props. Require matching CoreImage/renderer support before loading; preserve normalization/source candidates. Skip framework memory/disk reads/writes and disk initialization, share bypass work only within its mode, retire same-source mode changes and preserve current cancellation/delivery. Do not claim purge of older/platform caches or native qualification.

- AC8: Deliver optional Image load/error notifications once for the current source/mode through the owning root scope and current handler. Retire replaced/detached requests; preserve work on placeholder-only changes without retries/replay or placeholder/empty-source events. Report request origin and largest positive native representation pixels (0×0 if unknown), generic errors and matching-package prerequisites without claiming drawing or runtime proof.

## Documentation

- AC1: [AppKit image loading](../../../docs/app/components.md#image-loading-on-appkit), [layout regressions](../../../packages/ui/src/image.macos.mobile.test.tsrx) and [maintained probe](../../../examples/probes/image-loading.macos.tsrx).
- AC2: [Renderer image contract](../../../packages/macos-renderer/README.md#render-local-images-and-overlays), [request regressions](../../../packages/macos-renderer/test/image-requests.test.ts) and [remote lifecycle regressions](../../../packages/macos-renderer/test/image-remote.test.ts). These tests are authored, not run; OS networking, threading and cancellation remain unqualified.
- AC3: [Optional-package AppKit subset](../../../packages/image/README.md#appkit-subset), [source qualification limits](../../../docs/testing/known-limits.md#experimental-appkit-renderer) and [target progress](../parity/appkit-progress.md#image-request-lifecycle-and-leaf-normalization). Runtime, layout/pixel, memory/responsiveness and packaged checks remain deferred; header/configuration/transform options and engine features remain gaps; default cache helpers now have the AC6 source path below.

- AC4: [AppKit fit and position](../../../docs/app/components.md#image-loading-on-appkit), [geometry regressions](../../../packages/macos-renderer/test/image-fit.test.ts), [fake drawing/resize regressions](../../../packages/macos-renderer/test/image-drawing.test.ts), [style-removal regressions](../../../packages/macos-renderer/test/style-reconcile.test.ts) and [maintained fit probe](../../../examples/probes/image-fit.macos.tsrx). Tests, native drawing, resize/orientation/density and pixel checks have not run; visual analysis remains unauthorized.

- AC3: [Resolution candidate selection](../../../docs/app/components.md#image-loading-on-appkit), [geometry callback regressions](../../../packages/macos-renderer/test/image-geometry.test.ts) and [component selection regressions](../../../packages/ui/src/image.macos.mobile.test.tsrx) cover source selection as a source contract. Native resize/screen transfer, density, intrinsic-only sizing and packaging remain unqualified; tests have not run.

- AC5: [Private renderer memory contract](../../../packages/macos-renderer/README.md#render-local-images-and-overlays), six added [request-policy cases](../../../packages/macos-renderer/test/image-requests.test.ts), two [fake remote cases](../../../packages/macos-renderer/test/image-remote.test.ts) and [manual fixture](../../../examples/probes/image-memory-cache.macos.tsrx), all unrun. [Target note](../parity/appkit-progress.md#appkit-decoded-image-memory-invalidation-prerequisite) records exact deferred commands. The separate AC6 source path now connects default public helpers to image-owned disk bytes. Advanced headers/configuration/engine options and native cache qualification remain incomplete; this memory-only seam does not close those gates.

- AC6: [Package subset and usage](../../../packages/image/README.md#appkit-subset), [native byte owner](../../../packages/macos-renderer/src/image-byte-cache.ts), [adapter](../../../packages/image/src/cache-bridge.macos.ts), twelve [byte-cache cases](../../../packages/macos-renderer/test/image-byte-cache.test.ts), nine [adapter cases](../../../packages/image/tests/cache.macos.test.ts), fourteen [view cases](../../../packages/macos-renderer/test/image-remote.test.ts), updated [placeholder cases](../../../packages/macos-renderer/test/image.test.ts) and [manual target fixture](../../../examples/probes/cached-image.macos.tsrx), all unrun. [Target note](../parity/appkit-progress.md#appkit-image-owned-byte-cache-and-public-helpers) records exact deferred commands. The shared mobile/web fixture now directs AppKit to its target fixture because decode-transform cache probes remain unsupported.

- AC7: [Bypass usage](../../../packages/image/README.md#appkit-subset), [renderer contract](../../../packages/macos-renderer/README.md#render-local-images-and-overlays), three added [byte cases](../../../packages/macos-renderer/test/image-byte-cache.test.ts), seven added [view cases](../../../packages/macos-renderer/test/image-remote.test.ts), two added [adapter cases](../../../packages/image/tests/cache.macos.test.ts), two [prop-dispatch cases](../../../packages/macos-renderer/test/image-policy-props.test.ts), two added [CoreImage cases](../../../packages/ui/src/image.macos.mobile.test.tsrx) and the updated [target fixture](../../../examples/probes/cached-image.macos.tsrx), all unrun. [Target note](../parity/appkit-progress.md#appkit-per-image-cache-bypass) records exact deferred commands and native/persistence/packaging limits.

- AC8: [Event contract and usage](../../../packages/image/README.md#appkit-subset), nine [event cases](../../../packages/macos-renderer/test/image-events.test.ts), three [pixel metadata cases](../../../packages/macos-renderer/test/image-pixels.test.ts), one [root binding case](../../../packages/macos-renderer/test/image-events-binding.test.ts), one added [adapter case](../../../packages/image/tests/cache.macos.test.ts), one added [CoreImage case](../../../packages/ui/src/image.macos.mobile.test.tsrx) and updated [target fixture](../../../examples/probes/cached-image.macos.tsrx). All fifteen added cases are unrun. [Target note](../parity/appkit-progress.md#appkit-current-image-load-and-error-callbacks) records deferred commands; native callback timing, metadata, bitmap lifetime and packaging remain unqualified.
