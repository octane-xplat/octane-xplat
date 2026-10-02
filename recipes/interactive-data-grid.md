# Manage an interactive data grid

ID: interactive-data-grid
Targets: web, ios, android, macos
Related APIs: @octane-xplat/table, DataGrid, useTable, getRowId, showGlobalFilter, showColumnFilters, showPagination, showRowSelection, showColumnSettings, resizableColumns, reorderableColumns

## Starting point

An app using Octane Xplat UI and the table leaf, with a bounded grid viewport,
immutable row data, stable IDs, and an explicit column schema. This workflow
covers the stock controls over a headless table engine; it does not promise a
spreadsheet, server data fetching, or column virtualization.

## Requirements

Filter/page/select data, manage visible column order and size with accessible
non-drag controls, and keep state ownership and platform verification explicit.

## Acceptance criteria

- AC1: Render a bounded virtualized grid with stable row IDs and a header that remains outside body scrolling; explain outer-scroll and horizontal-width limits.
- AC2: Filter text/numeric cells, clear filters, reset the page on filter/size changes, and compose a pager with explicit client/server ownership.
- AC3: Select eligible rows without activating them, select only the current page, preserve off-page IDs, and clear all selection.
- AC4: Show/hide permitted columns, move them without dragging, and reset visibility/order/size to initial state.
- AC5: Resize within configured bounds and commit column reordering on release; cancellation restores width/order, and buttons provide a keyboard/touch alternative.
- AC6: Own controlled state updates and distinguish build/component evidence from runtime input, accessibility, and remaining platform/parity gaps.

## Documentation

- AC1: [Enable interaction controls](../packages/table/README.md#enable-interaction-controls), [bounded example](../packages/table/examples/interactive.tsrx).
- AC2: [Control behavior](../packages/table/README.md#enable-interaction-controls), [server pages](../packages/table/README.md#controlled-state).
- AC3: [Selection scope](../packages/table/README.md#enable-interaction-controls), [example](../packages/table/examples/interactive.tsrx).
- AC4: [Column settings](../packages/table/README.md#enable-interaction-controls), [example](../packages/table/examples/interactive.tsrx).
- AC5: [Width and gesture contract](../packages/table/README.md#enable-interaction-controls), [example probe](../packages/table/examples/interactive.tsrx).
- AC6: [Controlled state](../packages/table/README.md#controlled-state), [verification and limits](../packages/table/README.md#verification-and-remaining-parity-gaps).
