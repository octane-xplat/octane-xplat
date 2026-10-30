# Page through AppKit onboarding content

ID: appkit-paging
Targets: macos
Related APIs: Pager, ScrollableArea, InternationalizationProvider

## Starting point

A small onboarding flow or gallery, matching PagerDemo's full-host pages and
caller-owned navigation. Native support is experimental and unqualified.

## Acceptance criteria

- AC1: Bound the viewport; each page fills it. Seed defaultPage once, clamp current count, apply controlled page changes without callback echoes, and render empty/refilled content. RTL follows current context; respect reduced motion.
- AC2: Settle real user scrolls after live tracking/quiet time. Report once only when native position reaches the selected boundary. Parent acceptance/rejection, replacement requests, resize, hidden/detached/moved windows and teardown must cancel stale work.
- AC3: Keep source/mock evidence distinct from real native layout/input/momentum, context/ref ordering, focus/accessibility, eager-page memory use and packaged import resolution. Do not add macOS to qualified parity targets without runtime evidence.

## Documentation

- AC1: [Pager guide](../../../packages/pager/README.md#platform-support), [native leaf](../../../packages/pager/src/Pager.macos.tsrx) and [authored state cases](../../../packages/pager/src/pager-state.macos.mobile.test.ts). All cases unrun.
- AC2: [User-scroll owner](../../../packages/pager/src/pager-scroll-events.macos.ts), [authored event cases](../../../packages/pager/src/pager-scroll-events.macos.mobile.test.ts), [object-driver composition cases](../../../packages/pager/src/Pager.macos.mobile.test.tsrx) and [manual fixture](../../../examples/probes/pager.macos.tsrx). Public UI peer is mocked to the real AppKit leaf in unit cases; production barrel selection remains unproven.
- AC3: [Target note](../../../tools/platform-qualification/evidence/appkit-progress-2026-10-30.md#appkit-pager-full-host-pages-and-user-settlement) records exact deferred commands and outstanding native gates. Existing web/iOS/Android parity target declarations remain unchanged.
