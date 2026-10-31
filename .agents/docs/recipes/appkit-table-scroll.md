# Scroll a wide data table on AppKit

ID: appkit-table-scroll
Targets: macos
Related APIs: Table, TableColumn, TablePlugin, pixel, proportional, useTableStickyColumns

## Starting point

A data table has more columns than its available width, as in the Astryx sticky
columns example. A native horizontal viewport and stable sizing are needed
before column pinning can work.

## Requirements

Scroll a wide AppKit data table in a native horizontal viewport with stable
column sizing and preserved shared slots.

## Acceptance criteria

- AC1: Data-mode Table has one native horizontal scroll viewport and a column document that preserves shared render-plan minimum width. Measure clip width on native geometry changes without repeated unchanged state writes. Child-composed tables retain their existing flow; document that boundary.
- AC2: Pixel columns do not shrink; proportional columns start from zero basis, grow by weight and honor declared/default minimums. Header and body use matching widths and preserve safe plugin styles. Actual mixed-column and resize geometry requires native evidence.
- AC3: Preserve scroll-wrapper classes/styles and before/after slots. Forward wrapper refs to NSScrollView and public Table ref to inner content; do not imply support for DOM handlers/attributes or pinned positioning.
- AC4: Maintain a manual narrow/wide, auto/bounded-height, empty/refill, mixed-width, plugin-slot/ref metrics fixture. Distinguish syntax/source evidence from native layout, trackpad/wheel/RTL, nested scrolling, ref teardown, accessibility and clean packaged-consumer qualification. Sticky columns remain a gap.

- AC5: Current controlled columnResize widths transform the resolved column definitions before width/header/body planning. Removing overrides restores original proportional/pixel widths; locked columns accept programmatic values without callback echoes. Ignore unknown/inherited keys and reject invalid visible values under plugin isolation. Document the separate native gesture/separator/min-max/callback source subset and keep native updates unqualified.

- AC6: Data Table textOverflow wrap/truncate reaches labels created by the default body renderer, with bounded shrink/grow styling, full text retention and mode removal. Keep custom renderer primitives/slots, headers and child-composed text independent. Prepare source/runtime-compiler models and manual long/short, wrap/truncate, width and custom-control trials; keep actual native measurement, ellipsis/paint, resize/sticky/input/AX and installed consumers unqualified until run.

## Documentation

- AC1: [AppKit table guide](../../../docs/app/tables.md#wide-data-tables-on-appkit), Octane primitive reference and [target note](../exploration.md#operational-evidence).
- AC2: The same [AppKit table guide](../../../docs/app/tables.md#wide-data-tables-on-appkit), Octane primitive reference and [target note](../exploration.md#operational-evidence).
- AC3: The same [AppKit table guide](../../../docs/app/tables.md#wide-data-tables-on-appkit), Octane primitive reference and [target note](../exploration.md#operational-evidence).
- AC4: [Manual fixture](../../../examples/probes/table-scroll.macos.tsrx). Existing pipeline/width tests do not prove native viewport layout or scrolling.

- AC5: Five [plan integration cases](../../../packages/ui/src/table/column-resize-plan.macos.test.ts) and the manual fixture width toggle; app guide and primitive reference explain controlled widths. See the [width-plan source note](../exploration.md#operational-evidence).

- AC6: [Body text guide](../../../docs/app/tables.md#choose-body-text-wrapping-on-appkit), [Octane guidance](../../skills/octane-xplat/references/primitives/tables.md#grouped-and-tree-tables), [four object-driver cases](../../../packages/ui/src/table/table-text-overflow.macos.mobile.test.tsrx), [two compiler cases](../../../packages/ui/tests/table-universal.test.mjs), [manual fixture](../../../examples/probes/table-scroll.macos.tsrx) and [source note](../exploration.md#operational-evidence). All authored checks require separate execution evidence.
