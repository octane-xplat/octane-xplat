# Resize AppKit data table columns

ID: appkit-table-column-resize
Targets: macos
Related APIs: Table, useTableColumnResize, UseTableColumnResizeConfig

## Starting point

An AppKit data table needs width adjustment by native dragging or keys, beyond
programmatic columnWidths. The shared plan already aligns header/body/scroll
widths, and sticky columns retain native cells.

## Acceptance criteria

- AC1: Preserve existing header overlay content while adding native handles only for unlocked columns. Reuse shared AppKit pan/key infrastructure, source-native cursor/focus and measured parent geometry; forward overlays from Table without clones or DOM imports.
- AC2: Cumulative drag translation and physical arrows mirror for RTL, ten-point keys/AX adjustments and Home/finite End honor normalized min/max limits, Escape/cancel does not commit, and source splitter role/orientation/numeric range uses the current view. Actual input, focus and AX require native proof.
- AC3: Controlled previews retire at commit unless parent acknowledges; uncontrolled widths persist in the full column plan. Reject stale scope/window/direction/contract, clean up geometry observers, and retire before callback reentry/errors. Programmatic writes do not echo. Explicitly document source differences from web's persistent local overrides/fixed RTL deltas.
- AC4: Maintain state/reentry, simulated native splitter and handle compiler cases, plus controlled acceptance/uncontrolled/lock/RTL/sticky manual controls. Separate source/syntax evidence from native gesture/key/hit-testing, geometry/performance, VoiceOver, cleanup and installed consumer qualification.

## Documentation

- AC1–AC4: [AppKit resize guide](../../../docs/tables.md#resize-columns-on-appkit), primitive skill, existing feature note and [target note](../parity/appkit-progress.md#appkit-table-resize-handle-source-path).
- AC2–AC4: Six [state cases](../../../packages/ui/src/table/column-resize-state.macos.test.ts), one [splitter case](../../../packages/macos-renderer/test/common-control-accessibility.test.ts), two [handle compiler cases](../../../packages/ui/tests/table-universal.test.mjs) and [manual fixture](../../../examples/probes/table-scroll.macos.tsrx), all unrun. Native callback dispatch is not OS input/AX proof.
