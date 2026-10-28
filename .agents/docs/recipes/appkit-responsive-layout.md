# Adapt a native macOS screen to its window

ID: appkit-responsive-layout
Targets: macos
Related APIs: useMediaQuery

## Starting point

An experimental native AppKit app using the standard platform host bridge.
The bridge exposes the primary app window's dimensions and resize events.

## Requirements

Choose layouts and input affordances from the actual desktop host rather than
assuming a phone screen or a touch pointer.

## Acceptance criteria

- AC1: A min/max-width or height query re-evaluates when the primary host window resizes, and unmount releases its subscription. A missing host reports false.
- AC2: Pointer and hover queries report fine pointer/hover on AppKit, without changing the touch traits of iOS/Android. Orientation uses the queried dimensions.
- AC3: Document the exact native query subset and separate source/bridge evidence from real resize, rendering and packaged-consumer qualification. Do not imply secondary-window ownership or reduced-motion query support.

## Documentation

- AC1: [Responsive AppKit layout](../../../docs/app/components.md#responsive-appkit-layout), [AppKit media source regressions](../../../packages/ui/src/media-query-source.macos.test.ts), [host snapshot regressions](../../../packages/platform/tests/appkit-window.test.mjs) and [maintained probe](../../../examples/probes/responsive-layout.macos.tsrx). Gap: actual host resize, hook rendering and unmount have not run.
- AC2: [Responsive AppKit layout](../../../docs/app/components.md#responsive-appkit-layout) and [native evaluator regressions](../../../packages/ui/src/media-query-native.test.ts). Gap: tests and actual target behavior have not run.
- AC3: [Responsive AppKit layout](../../../docs/app/components.md#responsive-appkit-layout) and [target evidence boundary](../parity/appkit-progress.md). Gap: secondary-window scoping and reduced-motion preferences are not implemented by this hook.
