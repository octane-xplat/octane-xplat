# `@octane-xplat/table`

```sh
pnpm add @octane-xplat/table
```

Headless data grid for Octane xplat apps. The row model — sorting, filtering,
grouping, expanding, pagination, row selection, column ordering/visibility/
sizing — is `@tanstack/table-core` v9 (framework-agnostic, DOM-free), bound to
component rendering through TanStack Store atoms and `useSyncExternalStore`.
Rendering goes through shared ui primitives (`VirtualList` windowing on every
target), so one column/state contract covers web, iOS/Android, and macOS.

```tsx
import { DataGrid } from '@octane-xplat/table'

const rows = [{ name: 'Passport', count: 1 }]
export function PackingGrid() {
	return (
		<DataGrid
			className="packing-grid"
			data={rows}
			columns={[
				{ accessorKey: 'name', header: 'Name' },
				{ accessorKey: 'count', header: 'Count', size: 120 },
			]}
			onRowPress={(row) => row.toggleSelected()}
		/>
	)
}
```

`DataGrid` is the default presentation: `vx-table-*` chrome (shared with the
bounded `Table` primitive), header rows from `table.getHeaderGroups()`,
virtualized body rows. Sortable headers toggle on press. The header and enabled
controls sit outside the body viewport, so they remain in place while rows scroll.
Give the grid a bounded height or a bounded flex parent.

```css
/* App stylesheet; keep the body viewport bounded. */
.packing-grid {
	height: 400px;
}
```

For custom rendering keep the headless half and draw your own rows:

```tsx
import { useTable } from '@octane-xplat/table'
import { Text } from '@octane-xplat/ui'

export function CustomRows() {
	const { table, state } = useTable({
		data: [{ name: 'Passport' }],
		columns: [{ accessorKey: 'name', header: 'Name' }],
	})
	return (
		<Text>
			{table.getRowModel().rows.length} rows; {state.sorting.length} sorts
		</Text>
	)
}
```

`createTable` (no hooks) constructs the same instance for headless use.

```ts
import { createTable } from '@octane-xplat/table'

const table = createTable({
	data: [{ name: 'Passport' }],
	columns: [{ accessorKey: 'name', header: 'Name' }],
})
console.log(table.getRowModel().rows.length)
```

## Enable interaction controls

All controls are opt-in. No UI dependency is added; the leaf uses shared Xplat
primitives and the existing table-core state.

```tsx
import { DataGrid } from '@octane-xplat/table'
import { Text } from '@octane-xplat/ui'

const orders = [{ id: 'order-1', name: 'Passport case', total: 12 }]

export function Orders() {
	return (
		<DataGrid
			id="orders"
			className="orders-grid"
			data={orders}
			getRowId={(order) => order.id}
			columns={[
				{
					accessorKey: 'name',
					header: 'Name',
					size: 180,
					minSize: 100,
					maxSize: 300,
					enableHiding: false,
				},
				{ accessorKey: 'total', header: 'Total', size: 120 },
			]}
			showGlobalFilter
			showColumnFilters
			showPagination
			showRowSelection
			showColumnSettings
			resizableColumns
			reorderableColumns
			initialState={{ pagination: { pageIndex: 0, pageSize: 10 } }}
			renderEmpty={() => <Text>No matching orders</Text>}
		/>
	)
}
```

```css
.orders-grid {
	height: 600px;
}
```

Import `Text` from `@octane-xplat/ui`. Start with your application's `orders`
array and immutable updates; IDs must remain stable through filtering, sorting,
pages, and data replacement. The [maintained example](examples/interactive.tsrx)
includes concrete rows and a nonvisual probe.

```ts
// Replace the data array when an order changes; preserve each ID.
const updatedOrders = orders.map((order) => ({ ...order, total: order.total + 1 }))
```

| Prop                            | Behavior                                                                                                                                                                                                                                                   |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `showGlobalFilter`              | Search across globally filterable columns. Changing the query resets the page index to zero.                                                                                                                                                               |
| `showColumnFilters`             | Text fields for filterable leaf headings. Default filter is `includesString`, including numeric cells; custom column `filterFn` or `options.defaultColumn.filterFn` takes precedence. Custom range/date filters need a custom presentation via `useTable`. |
| `showPagination`                | Previous/next, page count, and page-size buttons. `pageSizeOptions` defaults to `[10,25,50]`; invalid/nonpositive/noninteger entries are ignored. Empty data shows page zero of zero. Changing page size resets to page zero.                              |
| `showRowSelection`              | Checkboxes for selectable rows, current-page select-all, total selected-ID count, and clear-all. IDs selected on other pages or outside the current filter remain selected.                                                                                |
| `getRowLabel`                   | Accessible row-checkbox label; falls back to the row ID.                                                                                                                                                                                                   |
| `renderSelectionActions(table)` | Caller-composed bulk actions next to the count/clear action; render only when `showRowSelection` is enabled.                                                                                                                                               |
| `showColumnSettings`            | A Columns button opens an inline panel with visibility checkboxes, earlier/later move buttons, and reset. `enableHiding:false` protects a column. Reset restores initial visibility/order/sizing.                                                          |
| `resizableColumns`              | Fixed-width columns, live pan resize, and narrow/widen buttons in 10-dip increments, clamped to `minSize`/`maxSize`. Cancel restores the column's previous sizing override.                                                                                |
| `reorderableColumns`            | Separate pan handles commit a leaf-column move on release after crossing an adjacent column midpoint. Cancel preserves order. Use settings move buttons for keyboard/touch access without dragging.                                                        |
| `direction`                     | `ltr` by default; `rtl` reverses horizontal gesture deltas. Match the direction to your surrounding layout; this prop does not itself mirror the layout.                                                                                                   |
| `options`                       | Core options such as state callbacks/atoms, selection predicates, server/manual row-model options, and defaults. Explicit `data`, `columns`, `state`, `initialState`, `features`, and `getRowId` props take precedence.                                    |

Selection never activates `onRowPress`; the activation surface is a separate
sibling of the checkbox. `options.enableRowSelection` can be a predicate to
block specific rows. Select-all means the **current row-model page**, not every
record in a server dataset. Clear removes off-page IDs too; the caller decides
whether to prune IDs when records disappear. A missing ID remains in the count
but has no loaded row in `table.getSelectedRowModel()`; use the selection state
for server-side bulk actions that include unloaded records.

Page selection ignores disabled rows. When some eligible rows are selected, the
page control shows a dash; activating it selects the remaining eligible rows.
An empty or entirely disabled page disables that control. Give `getRowLabel` a
human-readable name, such as `row => row.original.name`, so a checkbox says
“Select Alice” rather than “Select a”. Web checkboxes support Space and Enter.

### Row accessibility

The web presentation exposes a table with header/row/cell roles. Its row count
includes header rows plus the **filtered** data total. Body indices follow the
filtered, sorted order with the page offset, before VirtualList removes
unmounted rows. For example, page index 2 with page size 10 starts at data row 21
(`aria-rowindex=22` with one header row). Sorting changes positions, not row IDs.
Controls stay outside the table's semantic container.

Selection and activation controls carry a “Row 21 of 60” hint on native and web.
NativeScript has no mixed checkbox-state enum, so mixed selection uses the
spoken value “Partially selected” without claiming checked or unchecked.
AppKit exposes `AXCheckBox` with numeric off/on/mixed values (0/1/2) derived from
semantic state, independently of spoken text. Disabled controls reject actions.
These are host properties; assistive-technology navigation and speech still need
OS verification. This presentation does not implement spreadsheet-style arrow
navigation between cells.

```tsx
export function SelectableOrders() {
	return (
		<DataGrid
			data={orders}
			getRowId={(order) => order.id}
			columns={[{ accessorKey: 'name', header: 'Name' }]}
			showRowSelection
			options={{ enableRowSelection: (row) => row.original.total > 0 }}
		/>
	)
}
```

Widths are read from live `columnSizing` via `column.getSize()`. Enabling resize
or reorder makes all columns fixed-width so gesture distances and row/header
layout agree. Without these flags, unspecified widths retain the original
flexible distribution. Keep the visible columns within the grid viewport; this
version does not add a horizontally synchronized scroll owner.

```tsx
export function SizedOrders() {
	return (
		<DataGrid
			data={orders}
			columns={[
				{ accessorKey: 'name', header: 'Name', size: 180, minSize: 100, maxSize: 300 },
				{ accessorKey: 'total', header: 'Total', size: 100 },
			]}
			resizableColumns
			reorderableColumns
		/>
	)
}
```

## Feature surface

`dataGridFeatures` (the default set) enables every stock feature whose
machinery is DOM-free — sorting, column/global filtering, grouping +
aggregation, expanding, pagination, pinning, selection, column
ordering/visibility/sizing — plus the row-model factories and builtin
`sortFns`/`filterFns`/`aggregationFns` registries, which v9 keeps as separate
slots.

```ts
import { createTable, dataGridFeatures } from '@octane-xplat/table'

const table = createTable({
	features: dataGridFeatures,
	data: orders,
	columns: [{ accessorKey: 'name', header: 'Name' }],
})
table.setSorting([{ id: 'name', desc: false }])
console.log(table.getRowModel().rows)
```

Not in the default set:

- `columnResizingFeature` — its drag handler installs `window` listeners;
  resize-gesture UI is a platform-leaf concern.
- `cellSelectionFeature` / `cellSpanningFeature` — range selection is
  spreadsheet-shaped; revisit per platform.

Pass `features` to add slots (e.g.
`features: { columnResizingFeature }` on a web-only surface).

```tsx
// Grid.web.tsx — upstream's resizing feature is browser-only.
import { columnResizingFeature } from '@tanstack/table-core'
import { DataGrid } from '@octane-xplat/table'

export function WebGrid() {
	return (
		<DataGrid
			data={[{ name: 'Passport' }]}
			columns={[{ accessorKey: 'name', header: 'Name' }]}
			features={{ columnResizingFeature }}
		/>
	)
}
```

## Controlled state

State slices live in `table.baseAtoms` (internal) with `table.atoms` as the
derived readonly view; `table.store` is the flat `TableState` store the
adapter subscribes to. For a custom `useTable` presentation, pass `state` plus `atoms` (external writable
atoms) or the corresponding change callbacks. DataGrid now exposes those through
`options`. A `state` snapshot alone freezes that slice; subscribing alone does
not make a read-only snapshot writable.

```tsx
import { useState } from 'octane'
import type { DataGridFeatures, TableState } from '@octane-xplat/table'

// useTable and Text are imported in CustomRows above. Call within a component.
export function ControlledRows() {
	const [sorting, setSorting] = useState<TableState<DataGridFeatures>['sorting']>([])
	const { table } = useTable({
		data: orders,
		columns: [{ accessorKey: 'name', header: 'Name' }],
		state: { sorting },
		onSortingChange: setSorting,
	})
	return <Text>{table.getRowModel().rows.length} rows</Text>
}
```

For example, a caller-owned sorting slice uses core updater callbacks:

```tsx
import { useState } from 'octane'
import { DataGrid, type DataGridFeatures, type TableState } from '@octane-xplat/table'

export function SortedOrders() {
	const [sorting, setSorting] = useState<TableState<DataGridFeatures>['sorting']>([])
	return (
		<DataGrid
			data={orders}
			columns={[{ accessorKey: 'name', header: 'Name' }]}
			state={{ sorting }}
			options={{ onSortingChange: setSorting }}
		/>
	)
}
```

Import `useState` from `octane`; the explicit state type keeps an empty initial
array from becoming `never[]`.

```tsx
import { useState } from 'octane'
import type { DataGridFeatures, TableState } from '@octane-xplat/table'

export function SortCount() {
	const [sorting] = useState<TableState<DataGridFeatures>['sorting']>([])
	return <Text>{sorting.length}</Text>
}
```

Selection uses the same ownership pattern. The callback receives either a new
value or a function that updates the previous value; `useState` accepts both:

```tsx
const [rowSelection, setRowSelection] =
    useState<TableState<DataGridFeatures>['rowSelection']>({})
<DataGrid data={rows} columns={columns} getRowId={row => row.id}
    showRowSelection getRowLabel={row => row.original.name}
    state={{ rowSelection }} options={{ onRowSelectionChange: setRowSelection }} />
```

Click a checkbox and the selected count should update. Filtering, changing pages,
and replacing data keep selection by ID. Clear selection also removes IDs for
records that are currently unloaded. The [interactive example](examples/interactive.tsrx)
uses this caller-owned selection. A snapshot without an update callback remains
read-only; DataGrid does not silently take ownership.

For server pages, supply already paged `data`, `state.pagination`, and
`options={{ manualPagination: true, rowCount, onPaginationChange }}`. The callback
receives the core updater and must publish the new controlled state plus fetch
that page. Unknown totals use `pageCount: -1`; next stays enabled, so the caller
must own terminal/cursor behavior. Supply `rowCount` for accessible server totals;
without it, the table reports an unknown row count (`aria-rowcount=-1`) and hints
say “Row 21” without a total. `pageCount` alone does not determine the exact final
row count. Filtering and sorting of manual server data are also caller-owned;
set the corresponding core manual options to avoid transforming it twice.
This is not an automatic server fetcher.

```tsx
import { useState } from 'octane'
import { DataGrid, type DataGridFeatures, type TableState } from '@octane-xplat/table'

// The parent fetches pageRows whenever pagination changes.
export function ServerPage({
	pageRows,
	rowCount,
	requestPage,
}: {
	pageRows: { id: string; name: string }[]
	rowCount: number
	requestPage: (pageIndex: number, pageSize: number) => void
}) {
	const [pagination, setPagination] = useState<TableState<DataGridFeatures>['pagination']>({
		pageIndex: 0,
		pageSize: 10,
	})
	return (
		<DataGrid
			data={pageRows}
			columns={[{ accessorKey: 'name', header: 'Name' }]}
			showPagination
			state={{ pagination }}
			options={{
				manualPagination: true,
				rowCount,
				onPaginationChange: (updater) => {
					const next = typeof updater === 'function' ? updater(pagination) : updater
					setPagination(next)
					requestPage(next.pageIndex, next.pageSize)
				},
			}}
		/>
	)
}
```

## Boundaries

- Vertical virtualization only (VirtualList); no horizontal column
  virtualization or sticky column-pinning layout. Headers stay outside vertical
  body scrolling; that does not pin them against an outer page scroll.
- `Table` in `@octane-xplat/ui` stays the bounded, unvirtualized
  presentational tier — DataGrid is the data-grid tier above it.

## Verification and remaining parity gaps

Run `pnpm --filter @octane-xplat/table typecheck`, `test`, `test:native`, `build`, and
`test:packed`. The source typecheck covers web and the iOS native resolution lane;
the native build uses the same shared controls for iOS/Android. Run the fixture:

```sh
pnpm probe run packages/table/examples/interactive.tsrx --target web --deps @octane-xplat/table
pnpm probe run packages/table/examples/interactive.tsrx --target ios --device YOUR_BOOTED_SIMULATOR_UDID --deps @octane-xplat/table
pnpm probe run packages/table/examples/geometry.tsrx --target macos --deps @octane-xplat/table
```

The geometry fixture isolates bounded row sorting and column resize/reorder from
filter/pager input. Its AppKit run measures native frames and retained row order.
The iOS and Android selection fixtures currently hit an unrelated Unicode
property-regex parse failure before assertions; the direct VirtualList iOS geometry case passes. The full
AppKit fixture has an unresolved filter-input timeout.

Use a real booted simulator ID from `pnpm probe doctor`. Results are handler
or pointer dispatch, not proof of OS input, hit-testing, or screen-reader
navigation. See the [audit implementation record](../../docs/notes/astryx-parity-table.md#implementation-follow-through)
for the actual targets/results and known probe blockers.

Still deferred: grouped section headers/detail/tree controls, frozen-column
layout, PowerSearch operator/date/multi-select filter UI, richer multi-sort UX,
column virtualization, cell editing, and OS screen-reader/input verification.
The maintained [selection fixture](examples/selection.tsrx) checks the real
VirtualList, caller state, eligible page scope, mixed controls, and a windowed
row ordinal. Chromium and AppKit pass its handler-dispatch and host-property
checks; iOS/Android object-driver checks cover shared controls but are not
on-device accessibility evidence. These limits do not remove the
underlying headless features.
