# Keep AppKit table columns visible while scrolling

ID: appkit-table-sticky-columns
Targets: macos
Related APIs: Table, useTableStickyColumns, UseTableStickyColumnsConfig

## Starting point

An AppKit data table has a horizontal viewport. A name/action column should
stay at the logical start and a status/editor column at the end while middle
columns scroll, including controlled and expanded proportional widths.

## Acceptance criteria

- AC1: AppKit selects a dedicated plugin, preserving shared contiguous-run/start-precedence membership. Forward header/body refs and compose wrapper refs. Missing placement bridge or empty config leaves ordinary scrolling; use one instance per data Table.
- AC2: Read unshifted measured cell/row bounds; calculate physical offsets for start/end and RTL, clamp to row bounds and prioritize start when runs overlap. Native constraint offsets and sibling order move existing views; do not substitute paint transforms/clones. Preserve current base layout on release and invalidate stale/reparented owners.
- AC3: Observe clip/document/viewport geometry and window updates, including initial attachment. Coalesce updates; release leases on hidden/detached cells, viewport replacement, disable/removal and disposal. Remove observers and reject late ownership. Opaque native background/row overlay source paths are separate from unimplemented web shadows/transitions.
- AC4: Maintain simulated native-pin/order, geometry/observer and compiler cases, plus interactive pinned button/field/RTL/multiple-run fixture controls. Separate source/syntax evidence from actual native layout/timing/order, hit-testing, IME/Tab/AX, rendering/performance and clean installed native consumer proof.

## Documentation

- AC1–AC4: [AppKit pinning guide](../../../docs/tables.md#sticky-columns-on-appkit), primitive skill, feature note and [target note](../exploration.md#operational-evidence).
- AC2–AC4: Three new [pin/order cases](../../../packages/macos-renderer/test/layout-pins.test.ts), six [geometry/observer cases](../../../packages/ui/src/table/sticky-columns-state.macos.test.ts), two [compiler cases](../../../packages/ui/tests/table-universal.test.mjs) and [manual controls](../../../examples/probes/table-scroll.macos.tsrx). Callback dispatch and computed constraint values do not establish OS hit-testing or native frame timing.
