# Scroll a wide data table on AppKit

ID: appkit-table-scroll
Targets: macos
Related APIs: Table, TableColumn, TablePlugin, pixel, proportional, useTableStickyColumns

## Starting point

A data table has more columns than its available width, as in the Astryx sticky
columns example. A native horizontal viewport and stable sizing are needed
before column pinning can work.

## Acceptance criteria

- AC1: Data-mode Table has one native horizontal scroll viewport and a column document that preserves shared render-plan minimum width. Measure clip width on native geometry changes without repeated unchanged state writes. Child-composed tables retain their existing flow; document that boundary.
- AC2: Pixel columns do not shrink; proportional columns start from zero basis, grow by weight and honor declared/default minimums. Header and body use matching widths and preserve safe plugin styles. Actual mixed-column and resize geometry requires native evidence.
- AC3: Preserve scroll-wrapper classes/styles and before/after slots. Forward wrapper refs to NSScrollView and public Table ref to inner content; do not imply support for DOM handlers/attributes or pinned positioning.
- AC4: Maintain a manual narrow/wide, auto/bounded-height, empty/refill, mixed-width, plugin-slot/ref metrics fixture. Distinguish syntax/source evidence from native layout, trackpad/wheel/RTL, nested scrolling, ref teardown, accessibility and clean packaged-consumer qualification. Sticky columns remain a gap.

- AC5: Current controlled columnResize widths transform the resolved column definitions before width/header/body planning. Removing overrides restores original proportional/pixel widths; locked columns accept programmatic values without callback echoes. Ignore unknown/inherited keys and reject invalid visible values under plugin isolation. Document missing native gesture/separator/min-max/callback support and keep native updates unqualified.

## Documentation

- AC1–AC4: [AppKit table guide](../../../docs/tables.md#wide-data-tables-on-appkit), Octane primitive reference and [target note](../parity/appkit-progress.md#appkit-data-table-horizontal-viewport-source-path).
- AC4: [Manual fixture](../../../examples/probes/table-scroll.macos.tsrx), authored but unrun. Existing pipeline/width tests do not prove native viewport layout or scrolling.

- AC5: Five [plan integration cases](../../../packages/ui/src/table/column-resize-plan.macos.test.ts) and the manual fixture width toggle, all unrun; app guide and primitive reference explain controlled widths. See the [width-plan source note](../parity/appkit-progress.md#appkit-controlled-table-column-width-plan).
