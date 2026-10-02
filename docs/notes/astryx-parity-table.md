# Table parity audit: Xplat Table + DataGrid and Astryx

Recommend keeping `@octane-xplat/ui`'s `Table` as the small, bounded display tier and completing interactive parity in the existing `@octane-xplat/table` leaf. V1 should cover accessible sorting, filtering, pagination, selection, stable identity, and row virtualization. Column management, grouping, and advanced desktop gestures can follow. This is a recommendation, not an implementation commitment.

## Scope and evidence

Audited 2026-10-02 against Xplat `b42a00b7e73c21f7546941fe30fa276b75e3a54f` and Astryx `06c8fa3165537dedbe67101cfcabbe14f0f82e82` (core package version `0.6.4`). Evidence is **desk-source**: contracts, source, documentation, and test definitions inspected; no application, browser, device, screenshot, or upstream test suite was run. No component code changed.

Astryx's [package export map][exports] exposes `@astryxdesign/core/Table` through `Table/index.ts` and `@astryxdesign/core/Table/utils` through `Table/utils.ts`. The [Table entry point][index] exports Table members, width helpers, plugin hooks, state helpers, and their types. The directory currently contains 101 files, including docs and tests; the supplied ~76-file estimate is not the current count. File count does not measure capability.

Local evidence:

- [Table.tsrx](../../packages/ui/src/Table.tsrx), [Table.web.tsrx](../../packages/ui/src/Table.web.tsrx), and [Table.macos.tsrx](../../packages/ui/src/Table.macos.tsrx): direct header/body rendering; no row-model or plugin pipeline. The unsuffixed file is a native leaf, not a shared headless engine.
- [props.ts](../../packages/ui/src/props.ts): `TableColumn`, `TableProps`, and `VirtualListProps` contracts.
- [tokens.css](../../packages/ui/src/theme/tokens.css) and [chrome.css](../../packages/ui/src/theme/chrome.css): row/cell flex layout, padding, border, and header weight. No stock sticky header or horizontal viewport.
- [ComponentsDemo.tsrx](../../packages/demos/src/ComponentsDemo.tsrx): two columns and three fruit rows, demonstrating `label`, `width: 50`, and `align: 'right'`. It does not exercise interaction, empty states, identity changes, or large data.
- No dedicated UI `Table` test was found in `packages/ui` source/tests. `route-table.test.ts` tests routing, not this component. Virtual-list tests and the [VirtualList demo](../../packages/demos/src/VirtualList.tsrx) exercise the separate list primitive.
- [table.ts](../../packages/table/src/table.ts), [DataGrid.tsrx](../../packages/table/src/DataGrid.tsrx), [props.ts](../../packages/table/src/props.ts), and [table.test.ts](../../packages/table/src/table.test.ts) establish a separate existing data-grid tier. Its tests cover row models, sorting, global filtering, pagination, store notifications, option updates, and controlled sorting. They do not establish rendered controls or platform runtime parity.

## Current Xplat coverage: engine versus presentation

The audited checkout includes `db65625c` (`feat(table): add @octane-xplat/table leaf package`). After fetching `origin/main`, rebasing reported the checkout already up to date: the fetched remote main is an ancestor of this audited revision. The comparison therefore includes the landed leaf, rather than treating every UI Table limitation as a missing framework capability.

`dataGridFeatures` already enables sorting, column/global filtering, grouping/aggregation, expansion, pagination, row selection, row/column pinning, and column ordering/visibility/sizing, with the row-model factories. These are existing headless capabilities, not proposed engine work. `DataGrid.tsrx` currently supplies sortable Pressable headers with direction indicators, visible-cell rendering, selected-row styling, row activation, custom cell/header templates, and a VirtualList body.

```tsx
import { createTable, dataGridFeatures, DataGrid } from '@octane-xplat/table'

const rows = [{ id: 'apples', fruit: 'Apples', qty: 3 }]
const columns = [
	{ accessorKey: 'fruit', header: 'Fruit' },
	{ accessorKey: 'qty', header: 'Qty' },
]
const table = createTable({
	data: rows,
	columns,
	features: dataGridFeatures,
	getRowId: (row) => row.id,
})
table.setSorting([{ id: 'qty', desc: true }])
console.log(table.getRowModel().rows.map((row) => row.original))

export function FruitGrid() {
	return (
		<DataGrid
			data={rows}
			columns={columns}
			getRowId={(row) => row.id}
			onRowPress={(row) => console.log(row.original.fruit)}
		/>
	)
}
```

The distinction matters: enabled pinning does not create a frozen-column layout; enabled sizing does not create resize handles or apply live size state; grouped/expanded row models do not create section headers, expander controls, or detail panels. Likewise, filtering and pagination models do not supply filter or pager controls. Selection styling does not supply checkbox/select-all controls. V1 work should connect the existing engine to accessible controls and appropriate presentation.

## What Astryx promises

[Table.spec.md][spec] owns semantic table anatomy and the common plugin protocol. Its FR1–FR3 promise one horizontal scroll region with overflow-dependent keyboard access/scroll containment, generated header/body sections in data mode, and caller-composed sections in children mode. FR5–FR8 specify sort controls and multi-sort priority, delegated selection checkboxes, row expansion/detail panels, and a replaceable/disableable default empty state.

FR9–FR12 specify named plugin ordering (`columnSettings → sort → tree → selection → pagination`, then other names in insertion order), sequential transforms, exception isolation, header slots (`before`, `content`, `after`, `overlay`, `below`), reverse context wrapping, and reuse of resolved plugin arrays. These are substantive extension guarantees, absent from UI `Table`.

```tsx
// Historical Astryx API at the audited revision; React, not shared Octane code.
import { Table, useTableSortable, useTableSortableState } from '@astryxdesign/core/Table'

export function SortedFruit() {
	const { sortedData, sortConfig } = useTableSortableState({
		data: [{ id: 'apples', fruit: 'Apples' }],
		defaultSort: [{ sortKey: 'fruit', direction: 'ascending' }],
	})
	const sort = useTableSortable(sortConfig)
	return (
		<Table
			data={sortedData}
			idKey="id"
			columns={[{ key: 'fruit', sortable: true }]}
			plugins={{ sort }}
		/>
	)
}
```

The spec explicitly leaves pagination, filtering, column management, tree, grouping, and sticky-column anatomy outside the aggregate ownership boundary. Their existence and APIs come from [Table.doc.mjs][table-doc], module doc files, exports, and implementations; “non-goal” here does not mean “not implemented.” The spec also labels several evidence gaps: sort glyph assertions, full phase ordering, known-name ordering, and failure isolation are not all runtime-covered; expansion `colSpan` can become stale when a later plugin changes columns. Do not equate a documented promise with complete upstream verification.

The row-status plugin has a separate [useTableRowStatus.spec.md][status-spec], covering its semantic/custom status contract. This is distinct from selection or editable cell state.

## Prioritized capability gaps

P0 is a prerequisite for credible interactive parity; P1 is the recommended v1 behavior; P2 is deferrable enhancement. All “missing” entries below refer specifically to `packages/ui` Table. Reordering/filtering supplied arrays or supplying custom cells is possible today, but the caller owns the entire behavior.

| Priority / capability                           | Astryx source and concrete API                                                                                                                                                                                                                                                                                                | UI Table gap                                                                                                                                                                                                                                                                       | Cross-platform fit and existing leaf position                                                                                                                                                                                                                                                                                                                                                                           |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P0 — stable identity and accessible interaction | `BaseTableProps.idKey`, `rowIndexStart`, `rowCount`; semantic `table/thead/tbody/tr/th/td`; plugin controls carry their own semantics. [Types][types], [BaseTable][base]                                                                                                                                                      | `keyFor` defaults to row index; web has table/row/header/cell roles but row activation is an `onClick` on a div, without a stock keyboard path. Native rows use `onTap`; `TableProps` does not extend `AccessibilityProps`. No full-dataset ordinals/count.                        | Essential everywhere. Leaf has `getRowId`, Pressable sort headers, and selected styling, but these do not establish complete table accessibility. Require keyboard, VoiceOver/TalkBack, focus, and virtualized ordinal checks.                                                                                                                                                                                          |
| P1 — sorting                                    | `column.sortable: boolean                                                                                                                                                                                                                                                                                                     | {sortKey?}`; `useTableSortable({sort, onSortChange, allowUnsortedState, isMultiSortEnabled})`; entries are `{sortKey, direction: 'ascending'                                                                                                                                       | 'descending'}`. State helper returns `sortedData`and accepts`comparators`. [Sortable][sort]                                                                                                                                                                                                                                                                                                                             | No sortable metadata, state, comparator, header control, indicator, or multi-sort priority.                                                                                                           | Portable state and single-column activation; Shift+click multi-sort is desktop-specific and needs a touch-accessible alternative. Leaf already has sort row models and header `toggleSorting()` controls; full Astryx multi-sort UX remains a gap. |
| P1 — filtering                                  | `column.filter: string                                                                                                                                                                                                                                                                                                        | {field, operator?}`; `useTableFiltering({filters, onFilterChange, searchConfig, variant})`, variants `popover`, `inline`, `inline-compact`; `useTableFilterState`, `toSearchFilters`. PowerSearch fields select text/select/multi-select/date/number controls. [Filtering][filter] | No filter state, field/operator schema, controls, clear action, or query conversion.                                                                                                                                                                                                                                                                                                                                    | Portable data/query state; touch can use a sheet rather than header popovers. Leaf has column/global filtering machinery, but DataGrid has no stock filter controls or PowerSearch-compatible schema. |
| P1 — pagination                                 | `useTablePagination({page, onPageChange, totalItems?, totalPages?, hasMore?, pageSize?, onPageSizeChange?})`; page is **1-based**; positions above/below/both/none and several control variants; `paginateData`. [Pagination][pagination]                                                                                     | No page state, count, page-size control, server/cursor navigation, or accessible ordinal offset.                                                                                                                                                                                   | Portable. Leaf has pagination state/row models, but no built-in pager UI; TanStack `pageIndex` is zero-based. Unknown-total/server semantics need explicit design.                                                                                                                                                                                                                                                      |
| P1 — row selection                              | `useTableSelection` injects a checkbox column and select-all/indeterminate controls; callbacks `onSelectItem({item,isSelected})`, `onSelectAll({isAllSelected})`; predicates for selectable/enabled rows; `useTableSelectionState` uses `selectedKeys`; `TableSelectionToolbar` composes bulk actions. [Selection][selection] | `onRowPress` is activation, not selection. No selected state, checkbox column, select-all scope, disabled selection, or bulk toolbar.                                                                                                                                              | Portable; define whether select-all means loaded/page/filtered/all-server rows. Leaf has row-selection state and highlight, but DataGrid neither injects checkboxes nor toggles selection by default.                                                                                                                                                                                                                   |
| P2 — column visibility and reorder              | `useTableColumnSettings` filters/reorders with `activeColumnKeys`, `onChangeActiveColumnKeys`; state helper supplies picker/toggle/reset helpers and metadata `isAlwaysVisible`, `group`. [Column settings][settings]                                                                                                         | Caller may reorder/remove `columns`; no settings state, reset, protected columns, or picker.                                                                                                                                                                                       | Portable preferences. A touch column picker is useful; dragging header cells is a desktop gesture. Leaf has ordering/visibility features, without a settings UI. Astryx's hook establishes ordering by keys, **not built-in drag-to-reorder headers**.                                                                                                                                                                  |
| P2 — column resize                              | `column.resizable`; `useTableColumnResize({columnWidths,onColumnResizeEnd,minWidth,maxWidth,columns})`; pointer and keyboard splitter controls, RTL, neighboring proportional-column adjustment. [Resize docs][resize-doc], [source][resize]                                                                                  | Numeric `width` is static; no gesture, constraints, resizing state, commit/cancel, or keyboard controls.                                                                                                                                                                           | Width state is portable; border dragging and splitter keys primarily serve desktop. Native interaction belongs in platform leaves. Leaf explicitly omits `columnResizingFeature`; its cell layout reads `columnDef.size`, not live `column.getSize()`, so headless sizing alone does not prove reactive resize presentation.                                                                                            |
| P2 — grouped rows                               | `useTableGroupedRows({data,groupBy,collapsedGroups,onToggleGroup,renderGroupHeader?,getRowKey?,groupOrder?})` returns `{data,plugin,idKey}` with synthetic section headers, counts, collapse, and suppressed ordinary cell rendering. [Grouped rows][groups]                                                                  | Flat ordinary rows only; no synthetic row kind or collapse state.                                                                                                                                                                                                                  | Portable section grouping, distinct from aggregation/pivot tables. Leaf has grouping/aggregation/expansion row models, but no dedicated section-header or group-toggle presentation matching this plugin.                                                                                                                                                                                                               |
| P2 — tree and detail expansion                  | `useTableTreeState`/`useTableTreeData`; `useTableRowExpansion({expandedKeys,onToggle,getRowKey,renderExpanded})`. [Entry point][index]                                                                                                                                                                                        | No hierarchy, indentation, expander, or detail panel.                                                                                                                                                                                                                              | Portable, but variable heights, nested focus, and recycling need deliberate handling. Leaf has headless grouping/expansion features, without Astryx-equivalent stock detail/tree controls.                                                                                                                                                                                                                              |
| P2 — pinned columns; header distinction         | `useTableStickyColumns({startKeys,endKeys})` uses cumulative logical offsets and scroll-aware shadows on header/body cells. [Sticky columns][sticky]                                                                                                                                                                          | No pinned columns or owned horizontal scrolling. No sticky header contract.                                                                                                                                                                                                        | Frozen columns are useful on wide desktop grids; small screens may prefer fewer visible columns. Astryx sticky **columns** do not establish a vertically sticky header. No stock vertical header pinning found in `TableHeader.tsx`, `TableHeaderCell.tsx`, or `Table.tsx`; grouped rows have a sticky section-label cell. Treat sticky table headers as an additional product requirement, not verified Astryx parity. |
| Separate requirement — cell editing             | `TableColumn.renderCell(item)` supports caller-composed inputs; no exported editing plugin, edit-value callback, validation lifecycle, commit/cancel contract, or grid navigation found. [Types][types], [exports][index]                                                                                                     | `renderCell(row,column,rowIndex)` can likewise render an input, but Table owns no editing lifecycle.                                                                                                                                                                               | Portable editor state; spreadsheet keyboard/range UX is desktop-heavy. Neither audited Table establishes built-in cell editing. Defer unless the product explicitly needs it.                                                                                                                                                                                                                                           |
| P1 scaling requirement — virtualization         | `BaseTable` maps the supplied data; `rowIndexStart`/`rowCount` support caller-windowed views. `transformScrollWrapper` offers a ref/chrome extension point. No exported `VirtualList` or built-in Table virtualizer found in Astryx's core export map/tree. [BaseTable][base], [types][types]                                 | All rows mount; none of the Table leaves uses Xplat VirtualList.                                                                                                                                                                                                                   | Portable row virtualization is valuable, but it is an Xplat architecture requirement rather than demonstrated Astryx built-in parity. Existing DataGrid already renders `table.getRowModel().rows` through VirtualList. No column virtualization is established.                                                                                                                                                        |

Other deferrable Astryx conveniences include row-index/status columns, aggregated header/row context actions, `density`, `dividers`, `isStriped`, `hasHover`, `verticalAlign`, text wrapping/truncation with default-cell hover tooltips, and compositional footer/section members. Their presentation varies by platform; hover and right-click must not be the only way to reach essential content/actions.

```tsx
// Historical Astryx presentation API; this is not an Xplat Table prop set.
import { Table } from '@astryxdesign/core/Table'

export function StripedFruit() {
	return (
		<Table
			data={[{ id: 'apples', fruit: 'Apples' }]}
			idKey="id"
			columns={[{ key: 'fruit' }]}
			isStriped
			hasHover
		/>
	)
}
```

Astryx separates controls from data transforms: `useTableSortable` does not itself sort the rows (`useTableSortableState` returns `sortedData`); filtering updates/query conversion do not apply predicates to the supplied data; pagination controls do not slice the supplied data (`paginateData` or the server does that). Grouping explicitly returns replacement `data` and `idKey`. Matching only the plugin names would miss these ownership differences.

```tsx
// Continue inside SortedFruit above: transform rows before handing them to Table.
const { sortedData, sortConfig } = useTableSortableState({
	data: [{ id: 'apples', fruit: 'Apples' }],
	defaultSort: [{ sortKey: 'fruit', direction: 'ascending' }],
})
const sort = useTableSortable(sortConfig)
const view = (
	<Table
		data={sortedData}
		idKey="id"
		columns={[{ key: 'fruit', sortable: true }]}
		plugins={{ sort }}
	/>
)
```

## API shapes where the components overlap

Astryx types below come from [types.ts][types] and [Table.tsx][table-source]. Xplat types come from `packages/ui/src/props.ts`.

| Concern                      | Xplat UI Table                                            | Astryx Table                                                                                                            | Consequence                                                                                                                                                     |
| ---------------------------- | --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Row data                     | Required `rows: Record<string, any>[]`                    | Optional generic `data?: T[]`, `T extends Record<string, unknown>`; also children mode                                  | Rename and generic typing needed for an adapter; do not silently infer missing data in Xplat.                                                                   |
| Columns                      | Required `columns: TableColumn[]`                         | Optional `columns: TableColumn<T>[]`; auto-generated from data keys if omitted                                          | Explicit schema is currently required by Xplat.                                                                                                                 |
| Column identity/value access | `key: string`; default `String(row[key] ?? '')`           | `key: string`; default cell renderer                                                                                    | Common key-based model; both allow custom content.                                                                                                              |
| Heading                      | `label?: string`, fallback raw `key`                      | `header?: ReactNode`, source fallback raw `key`                                                                         | Astryx allows rich headers. Its types comment says “capitalized key,” but `BaseTable` uses `col.header ?? col.key`; do not copy that documentation discrepancy. |
| Width                        | `width?: number` in dips; omitted shares space equally    | `width?: pixel(n)                                                                                                       | proportional(n,{minWidth}?)`; explicit proportional widths have a 120px default minimum, omission lacks that floor                                              | Fixed logical size roughly maps to `pixel`; weighted widths/minimums have no UI equivalent. Browser pixels and native dips require a documented platform contract. |
| Alignment                    | `'left'                                                   | 'center'                                                                                                                | 'right'`                                                                                                                                                        | `'start'                                                                                                                                                           | 'center'                                                                                                       | 'end'`, default start | Xplat's physical edges are not a logical RTL contract; do not globally translate start to left. |
| Custom cell                  | Table-level `renderCell(row,column,rowIndex)`             | Per-column `renderCell(item)`                                                                                           | Xplat needs manual column dispatch; Astryx renderer does not receive row index.                                                                                 |
| Row identity                 | `keyFor(row,rowIndex): string`, default index             | `idKey: keyof T                                                                                                         | ((item) => string                                                                                                                                               | number)`, default index                                                                                                                                            | Stable IDs must survive sorting/filtering/page changes; array position is unsuitable for interactive identity. |
| Empty content                | `empty?: any`; absent renders no empty content            | `emptyState?: ReactNode                                                                                                 | false`; absent renders compact “No data” EmptyState                                                                                                             | Different names and defaults; an adapter must preserve intentional silence vs default messaging.                                                                   |
| Root customization           | `id`, `className`, `style`, `ios/android/web` escape bags | HTML `BaseProps`, StyleX `xstyle`, native HTML-table ref; scroll wrapper customization                                  | Styling/ref/plugin HTML types cannot be carried unchanged into native leaves.                                                                                   |
| Row activation               | `onRowPress(row,rowIndex)`                                | No equivalent Table-level `onRowPress` in audited public contract; row HTML props or plugin transforms compose handlers | Preserve Xplat's useful normalized event rather than inventing a matching Astryx prop.                                                                          |

For example, a current `{key:'qty', label:'Qty', width:50, align:'right'}` column maps approximately to Astryx `{key:'qty', header:'Qty', width:pixel(50), align:'end'}` **only in LTR**. Moving Xplat's top-level renderer to a column closes over that column explicitly. These are API adaptations, not evidence of behavioral parity.

### DataGrid API compared with Astryx

The existing leaf has a different public shape from UI Table. Its contract is `packages/table/src/props.ts`; its state adapter is `useTable.tsrx`.

| Concern                             | Existing Xplat DataGrid / adapter                                                                                                                                                                         | Astryx Table / plugins                                                                                      |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Data and column schema              | `data: TData[]`, TanStack `ColumnDef` with `accessorKey`/accessor functions, `header`, `cell`, `size`                                                                                                     | `data?: T[]`, `TableColumn.key`, `header`, `renderCell`, `pixel`/`proportional` widths                      |
| State ownership                     | `state`, `initialState`, `features`; `createTable` for headless use and `useTable` returning `{table,state}`                                                                                              | Named `plugins`; feature-specific configs and controlled callbacks; separate state helpers                  |
| Sorting / pagination representation | Sorting entries `{id,desc}`; pagination `{pageIndex,pageSize}`                                                                                                                                            | Sorting entries `{sortKey,direction}`; pagination `page`, `pageSize`, `onPageChange`, optional `hasMore`    |
| Identity                            | `getRowId(row,index): string`                                                                                                                                                                             | `idKey` field name or function returning string/number                                                      |
| Rendering overrides                 | `renderCell(cell)`, `renderHeader(header)`; TanStack contexts expose values and row/column methods                                                                                                        | Per-column `renderCell(item)`; plugins transform header/body render props                                   |
| Empty / activation                  | `renderEmpty(): any`, `onRowPress(row: Row)`                                                                                                                                                              | `emptyState` node/false; no matching top-level row-activation prop                                          |
| Controlled updates                  | `useTable` subscribes to `table.store`; its options contract accepts core options, including external atoms. DataGrid forwards `state` but exposes no general per-slice update callbacks or `atoms` prop. | Explicit callbacks such as `onSortChange`, `onFilterChange`, `onPageChange`, and `onChangeActiveColumnKeys` |

Do not promise an Astryx-compatible adapter from matching names alone. A controlled DataGrid view needs a clear way for user actions to notify the owner and receive updated state; lower-level `useTable`/core subscriptions are currently the escape route. Width, pinning, grouping, and selection also need presentation contracts beyond their state slices.

```tsx
import { useTable } from '@octane-xplat/table'
import { Pressable, Text } from '@octane-xplat/ui'

export function SortControl() {
	const { table } = useTable({
		data: [{ id: 'apples', qty: 3 }],
		columns: [{ accessorKey: 'qty', header: 'Qty' }],
		getRowId: (row) => row.id,
	})
	return (
		<Pressable onPress={() => table.setSorting([{ id: 'qty', desc: true }])}>
			<Text>Sort by quantity</Text>
		</Pressable>
	)
}
```

## VirtualList boundary and phased recommendation

Xplat's `VirtualListProps<T>` supplies `items`, `keyExtractor`, `getItemType`, `renderItem`, `renderHeader`, `renderFooter`, and `renderEmpty`. It exposes no sticky-header flag or table column-sizing protocol. Wrapping a fully rendered Table in a list does not virtualize its rows. Use the final row model as list items, with stable row IDs and a separately rendered header sharing the same column layout. Existing `DataGrid.tsrx` already follows that structure, with headers outside the scrolling list; this is structurally different from a CSS-sticky header inside one viewport.

```tsx
import { VirtualList, Text } from '@octane-xplat/ui'

export function FruitList() {
	return (
		<VirtualList
			items={[{ id: 'apples', name: 'Apples' }]}
			keyExtractor={(item) => item.id}
			getItemType={() => 'fruit'}
			renderItem={(item) => <Text>{item.name}</Text>}
			renderHeader={() => <Text>Fruit</Text>}
			renderFooter={() => <Text>End of list</Text>}
			renderEmpty={() => <Text>No fruit yet</Text>}
		/>
	)
}
```

1. **Phase 0 — preserve the two tiers and close the baseline contract (P0).** Keep UI Table bounded. Add future coverage for stable keys, custom cells, empty states, width/alignment, keyboard row activation, and accessible row/header semantics. Define logical alignment, rich headings, overflow ownership, and full-dataset row ordinals before promising interactive parity. Reconcile UI Table's current large-data guidance (platform UITableView/RecyclerView) with the existing shared VirtualList/DataGrid path.
2. **Phase 1 — usable cross-platform v1 (P1).** Complete the existing leaf's accessible sort controls, filter controls, pager, selection checkboxes/select-all, and bulk-action composition. Reuse its row-model/state machinery instead of adding a second engine to UI Table. Specify controlled state notifications, stable IDs, client vs server transforms, sort reset behavior, filter clearing, empty-results behavior, page reset/clamping, and selection scope. Define filter → sort → page → window ownership so data is never filtered/paginated twice. Use explicit visible controls on touch; do not require Shift, hover, or right-click.
3. **Phase 2 — configurable tables (P2).** Add visibility/order settings and reset/protected-column behavior, section grouping and expansion/tree presentation, then shared column-layout state and optional pinning. Confirm group IDs cannot collide with data IDs and that headers/rows remain aligned after visibility, order, width, and RTL changes. Add resize only after the presentation consumes live size state. Desktop leaves can implement splitter handles/keys; native leaves can expose a settings control or deliberately omit border dragging.
4. **Phase 3 — advanced desktop/product extensions.** Consider pointer header reordering, context menus, persistent preferences, spreadsheet editing/range selection, and column virtualization only for demonstrated workloads. Vertical sticky headers are a separately specified enhancement. Do not claim these as existing Astryx promises or necessary cross-platform v1 parity.

V1 completion should mean maintained examples plus behavior coverage on web, iOS, and Android: sorting/filtering/page transitions; disabled and indeterminate selection; data replacement; focus/activation; stable row IDs through list recycling; variable-height custom cells; and accessible ordinals/counts. Validate macOS separately before promising its runtime behavior. State tests alone do not prove controls, OS input, hit-testing, screen-reader output, or recycled row correctness. No prior-session runtime claims are used as verification in this audit.

This audit changes no public behavior, setup, or supported workflow, so no recipe criteria or Silo recipe coverage require changes. The phased implementation would need its own recipe/example reconciliation and `pnpm check:recipes`; that is future work, not completed parity.

## Implementation follow-through

The later implementation request authorized the following plan on top of this
source audit. The preceding sections preserve the audited baseline.

| Step                                | Concrete work and acceptance                                                                                                                                                         | Status                                                                                                          |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| 1 — expose existing state ownership | DataGrid `options` forwards core callbacks/atoms and manual server options; explicit props win. Correct outdated UI imports/type exports and add web/native source typechecks.       | Implemented; controlled sorting callback component test.                                                        |
| 2 — v1 controls                     | `GridControls.tsrx`, `GridPagination`, and DataGrid checkboxes expose text filtering, page/size controls, page-scoped eligible selection, count/clear, and caller bulk actions.      | Implemented; component coverage plus real-host fixture.                                                         |
| 3 — column management               | Columns panel controls visibility/order/reset, honors `enableHiding:false`, and uses touch/keyboard move buttons.                                                                    | Implemented; reset restores initial visibility/order/sizing.                                                    |
| 4 — resize/reorder                  | `ColumnDrag.tsrx` uses shared pan events, live column sizes, bounds, cancellation rollback, release-only order commits, and +/- alternatives; `direction` controls gesture sign.     | Implemented without adopting the browser-only table-core resize listener feature.                               |
| 5 — bounded header ownership        | Header stays outside `VirtualList` body with `flexShrink=0`; grid/body expose stable IDs.                                                                                            | Existing structure retained and strengthened; outer-page sticky positioning and frozen columns remain deferred. |
| 6 — evidence and documentation      | Maintained `packages/table/examples/interactive.tsrx`, control regression tests, leaf README, and `interactive-data-grid` recipe; coverage/verification recorded separately in Silo. | Verification results below; no publishing.                                                                      |

Native and web source typechecks, web/native package builds, packed-consumer
Bundler/NodeNext checks, and 16 tests pass. Shared CSS validation has zero
unsupported properties. Repository TSRX lint has unrelated existing failures;
changed leaf files are checked separately.

Runtime evidence is handler dispatch, not OS input or accessibility testing.
Web currently reaches all 15 interaction assertions but the runner reports a
VirtualList ResizeObserver delivery error, leaving the overall probe **failed**.
AppKit cannot build the fixture because `svg.mobile.ts` reaches its UI barrel
and trips the platform-boundary guard. Android has no authorized device.
iOS reaches nine assertions for paging/filtering/selection/settings, then
times out verifying header resizing: both the grid and header measurements
return the host frame (402 × 874), even with a registered native root. Native
resize/reorder geometry remains unverified. Both web and iOS overall runs
are **failed**, not clean runtime passes. Final run IDs: web
`122851f4-dfb0-437e-a36a-442c771c6aab`; iOS
`b3dfcaac-356c-4ffb-bc31-9162f7be3af4`.

### VirtualList measurement and reorder follow-through (2026-10-02)

Rechecked the implementation above from rich-cub base `43be0022` before changing
code. The existing Chromium interactive fixture already passed all 15 assertions
with no ResizeObserver delivery error. A maintained list fixture also exercises
width/row-height changes above a scrolled anchor and leaves browser errors fatal;
no global error filter or suppression was added.

NativeScript's `layoutChanged` event was missed by lowercased universal JSX event
bindings. VirtualList now subscribes by the exact native event name, waits for a
valid viewport layout, re-reads queued row sizes after layout, and removes those
listeners on disposal. Both native and web positioned lists now update row
positions and total body height when measured sizes change without changing the
visible row range. Pooling, keyed row ownership, platform leaves, and public
props stay intact.

AppKit's renderer recorded keyed insertion order but appended native stack views.
It now inserts at the requested position within the correct stack gravity area.
Retained row views survive descending/ascending reorder; no list remount workaround
is used.

Nonvisual runtime evidence:

- iOS direct VirtualList fixture: 8 assertions passed; viewport `280×160`, header
  height `24`, three row heights `32`, and first-to-third row distance `64`.
  Invalid initial `402×874` descendant frames are no longer used as settled rows.
- AppKit direct list: 4 assertions passed, including retained view identity and
  ascending/descending native positions. Bounded DataGrid geometry fixture:
  8 assertions passed; grid height `300`, header height `42`, body height `258`,
  and initial name-column width `140`; resize/clamping/cancellation and column
  reorder passed through handler dispatch.
- Chromium: full interactive DataGrid 15 assertions and list resize fixture
  5 assertions passed without unhandled resize errors. The resize fixture
  returned to scroll offset `344` after four height/width changes.

The maintained cases live in `packages/ui/tests/virtual-list.*.tsrx` and
`packages/table/examples/geometry.tsrx`. Focused unit coverage includes native
layout-event spelling, invalid initial frames, disposal, same-range measurement
updates, and AppKit native insertion order. Table tests/typechecks and web/native
builds pass. These checks establish host geometry and synthetic handler behavior,
not OS input, hit-testing, assistive technology, or frame pacing.

The full iOS DataGrid rerun remains blocked before assertions by the unrelated
Markdown Unicode-regex parse failure in the UI barrel on the available simulator.
The full AppKit interaction fixture reaches runtime but times out at text-filter
input; its independent sort/resize/reorder fixture passes. Android runtime was
not run in this task. The original failed runs above remain historical evidence.

Remaining work follows the original priorities: complete native indeterminate
selection/accessibility semantics and virtual row ordinals; then grouped/tree/
detail presentations, richer filter types and multi-sort controls, horizontal
scroll/pinned-column layout, per-column resize policies, and desktop splitter
keyboard semantics. The stock resize buttons offer an accessible alternative
but do not reproduce Astryx's WAI-ARIA splitter protocol or neighboring
proportional-column preservation. No cell-editing system is introduced.

[exports]: https://github.com/facebook/astryx/blob/06c8fa3165537dedbe67101cfcabbe14f0f82e82/packages/core/package.json
[index]: https://github.com/facebook/astryx/blob/06c8fa3165537dedbe67101cfcabbe14f0f82e82/packages/core/src/Table/index.ts
[spec]: https://github.com/facebook/astryx/blob/06c8fa3165537dedbe67101cfcabbe14f0f82e82/packages/core/src/Table/Table.spec.md
[types]: https://github.com/facebook/astryx/blob/06c8fa3165537dedbe67101cfcabbe14f0f82e82/packages/core/src/Table/types.ts
[base]: https://github.com/facebook/astryx/blob/06c8fa3165537dedbe67101cfcabbe14f0f82e82/packages/core/src/Table/BaseTable.tsx
[table-doc]: https://github.com/facebook/astryx/blob/06c8fa3165537dedbe67101cfcabbe14f0f82e82/packages/core/src/Table/Table.doc.mjs
[table-source]: https://github.com/facebook/astryx/blob/06c8fa3165537dedbe67101cfcabbe14f0f82e82/packages/core/src/Table/Table.tsx
[sort]: https://github.com/facebook/astryx/blob/06c8fa3165537dedbe67101cfcabbe14f0f82e82/packages/core/src/Table/plugins/sortable/useTableSortable.tsx
[filter]: https://github.com/facebook/astryx/blob/06c8fa3165537dedbe67101cfcabbe14f0f82e82/packages/core/src/Table/plugins/filtering/useTableFiltering.tsx
[pagination]: https://github.com/facebook/astryx/blob/06c8fa3165537dedbe67101cfcabbe14f0f82e82/packages/core/src/Table/plugins/pagination/useTablePagination.tsx
[selection]: https://github.com/facebook/astryx/blob/06c8fa3165537dedbe67101cfcabbe14f0f82e82/packages/core/src/Table/plugins/selection/useTableSelection.tsx
[settings]: https://github.com/facebook/astryx/blob/06c8fa3165537dedbe67101cfcabbe14f0f82e82/packages/core/src/Table/plugins/columnSettings/useTableColumnSettings.tsx
[resize-doc]: https://github.com/facebook/astryx/blob/06c8fa3165537dedbe67101cfcabbe14f0f82e82/packages/core/src/Table/useTableColumnResize.doc.mjs
[resize]: https://github.com/facebook/astryx/blob/06c8fa3165537dedbe67101cfcabbe14f0f82e82/packages/core/src/Table/plugins/columnResize/useTableColumnResize.tsx
[groups]: https://github.com/facebook/astryx/blob/06c8fa3165537dedbe67101cfcabbe14f0f82e82/packages/core/src/Table/plugins/groupedRows/useTableGroupedRows.tsx
[sticky]: https://github.com/facebook/astryx/blob/06c8fa3165537dedbe67101cfcabbe14f0f82e82/packages/core/src/Table/plugins/stickyColumns/useTableStickyColumns.tsx
[status-spec]: https://github.com/facebook/astryx/blob/06c8fa3165537dedbe67101cfcabbe14f0f82e82/packages/core/src/Table/plugins/rowStatus/useTableRowStatus.spec.md
