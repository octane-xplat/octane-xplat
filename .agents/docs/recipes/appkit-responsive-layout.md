# Adapt a native macOS screen to its window

ID: appkit-responsive-layout
Targets: macos
Related APIs: useMediaQuery, useWindowSize, useAppState, useSafeAreaInsets, useBreakpoints$, useBackHandler

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

- AC4: Give screen/lifecycle/safe-area/breakpoints canonical and existing explicit .ts/.tsrx subpaths AppKit runtime/type conditions. Move root hook calls into TSX/TSRX leaves matching the actual preset include and share implementations with the root. Keep non-AppKit fallback resolution and existing public exports/types, except the explicit alpha correction of AppKit useBackHandler to shared void.
- AC5: Keep immutable stable copied/validated primary-window snapshots, existing zero-size/active fallbacks, current activity vocabulary and stable host/method subscriptions with independent cleanup. Reject retired callbacks, coalesce synchronous acquisition notifications, isolate native delivery errors, handle cleanup failure and allow a subsequent render to retry failed registration/select late or replaced hosts. No polling or secondary-window claim.
- AC6: Extend real packed source/type lanes to include previously skipped AppKit purpose entries and explicit spellings, matching the actual TSX/TSRX compiler include and checking selected/excluded source paths. Author eight source models and a manual reader fixture; reconcile guide/README/skill/breaking note and exact deferred commands without claiming native/compiler/runtime proof.
- AC7: Stylesheet `@media` width/height rules re-evaluate when a host window resizes, coalesced into one restyle. Document that every window shares one viewport (the largest host window content area) and that native resize delivery is unqualified.

## Documentation

- AC1: [Responsive AppKit layout](../../../docs/app/components.md#responsive-appkit-layout), [AppKit media source regressions](../../../packages/ui/src/media-query-source.macos.test.ts), [host snapshot regressions](../../../packages/platform/tests/appkit-window.test.mjs) and [maintained probe](../../../examples/probes/responsive-layout.macos.tsrx). Gap: actual host resize, hook rendering and unmount have not run.
- AC2: [Responsive AppKit layout](../../../docs/app/components.md#responsive-appkit-layout) and [native evaluator regressions](../../../packages/ui/src/media-query-native.test.ts). Gap: tests and actual target behavior have not run.
- AC3: [Responsive AppKit layout](../../../docs/app/components.md#responsive-appkit-layout) and [target evidence boundary](../parity/appkit-progress.md). Gap: secondary-window scoping and reduced-motion preferences are not implemented by this hook.

- AC4–AC6: [AppKit window/activity guide](../../../docs/platform/platform-services.md#read-appkit-window-and-activity-state), [styling entry](../../../docs/app/styling.md#native-appkit-window-width), [root barrel](../../../packages/platform/src/index.macos.ts), [conditional exports](../../../packages/platform/package.json), [eight source models](../../../packages/platform/tests/appkit-state.test.mjs), [packed source lane](../../../packages/platform/tests/packed-consumer.mjs), [packed declarations](../../../packages/platform/tests/packed-macos.test.mjs), [manual readers](../../../examples/probes/platform-state.macos.tsrx) and [target note](../parity/appkit-progress.md#appkit-responsive-and-lifecycle-purpose-entries). All models, actual compiler selection/type generation, native resize/activity/IME/focus/AX/subscription memory and installed consumers remain unrun/unqualified. Fixture run waits only for mounting; original AC1–AC3 remain unchanged.
- AC7: [Renderer stylesheet limits](../../../packages/macos-renderer/README.md#apply-stylesheets), [known limits](../../../docs/testing/known-limits.md) and [target note](../parity/appkit-progress.md#appkit-css-state-selectors-and-resize-media). Gap: no maintained test drives the resize observer or per-window media; actual window resize, restyle timing and secondary-window behavior have not run.
