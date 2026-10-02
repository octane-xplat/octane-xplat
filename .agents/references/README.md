# Reference implementations

Use these projects to compare concrete behavior and design choices. They are
research references, not dependencies or commitments to copy their APIs.

## List virtualization

### FlashList v2

- Links: [repository](https://github.com/Shopify/flash-list),
  [architecture](https://shopify.engineering/flashlist-v2),
  [usage](https://shopify.github.io/flash-list/docs/usage/),
  [recycling](https://shopify.github.io/flash-list/docs/recycling/).
- Study its progressive measurement and correction, velocity-aware render
  window, cell recycling, and visible-position maintenance.
- Boundary: FlashList v2 requires React Native's New Architecture. Its
  renderer and lifecycle do not transfer directly to Octane or AppKit.

### Legend List

- Links: [repository](https://github.com/LegendApp/legend-list),
  [v3 guides](https://legendapp.com/open-source/list/v3/guides/),
  [v3 API](https://legendapp.com/open-source/list/v3/api/).
- The v3 docs currently label the version beta; check release status before
  relying on version-specific behavior.
- Source map: [container allocation](https://github.com/LegendApp/legend-list/blob/main/src/core/doInitialAllocateContainers.ts),
  [visible-item calculation](https://github.com/LegendApp/legend-list/blob/main/src/core/calculateItemsInView.ts),
  [scroll anchoring](https://github.com/LegendApp/legend-list/blob/main/src/core/mvcp.ts),
  [native containers](https://github.com/LegendApp/legend-list/blob/main/src/components/Containers.native.tsx).
- Study it as a second design point for variable-height rows: viewport size,
  draw distance, and estimates size the initial container set; measurements
  correct positions; visible content can be anchored; recycling is optional.
- Boundary: its native entry uses React Native views and lifecycle, with a
  separate React web entry. Neither is an Octane or AppKit implementation.

Our current shared-list contract and evidence are in
[`docs/notes/primitive-notes.md`](../../docs/notes/primitive-notes.md#virtuallist-vertical-foundation-stage-2-2026-09-27).
Fast-scroll performance remains open in
[`docs/notes/open-questions.md`](../../docs/notes/open-questions.md).
