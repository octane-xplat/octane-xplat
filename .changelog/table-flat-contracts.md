### Table becomes a data-driven component with a plugin pipeline

`Table` now follows Astryx's contract — a breaking change from the earlier `columns`/`rows` grid:

- **Data mode**: pass `data` + `columns` (`TableColumn` with `header`, `proportional()`/`pixel()` widths, `align`, `sortable`, `resizable`, `filter`, `renderCell`) plus `idKey`. `density`, `dividers`, `isStriped`, `hasHover`, `verticalAlign`, `textOverflow`, `emptyState`, and `aria-rowindex` support are built in.
- **Children mode**: compose `TableHeader`, `TableBody`, `TableFooter`, `TableRow`, `TableCell`, and `TableHeaderCell` directly — they read styling from the table's context.
- **Plugins**: `plugins={{ sort, selection, pagination, ... }}` runs a transform pipeline. Ten flat-table hooks ship with it: `useTableSelectionState`/`useTableSelection`, `useTableSortableState`/`useTableSortable`, `useTablePagination` (+ `paginateData`), `useTableColumnSettingsState`/`useTableColumnSettings`, `useTableColumnResize`, and `useTableFilterState`/`useTableFiltering` (+ `toSearchFilters` bridging to `PowerSearchConfig`).
- **`TableSelectionToolbar`** renders the selection-aware bulk-action surface above a table.
- Column sizing helpers `proportional`, `generateColumns`, `resolveColumnWidths`, `defaultCellRenderer`, and `DEFAULT_MIN_COLUMN_WIDTH` are public; `pixel` is shared with the resizable-size DSL (same `{type:'pixel', value}` shape).

The old `rows`/`label`/`width: number`/`onRowPress` API is removed. Interactive column resizing currently lands its drag/keyboard separator on web; native leaves apply `columnWidths` overrides without the handle.

[Table](https://octane-xplat.goddardai.org/components#table)
