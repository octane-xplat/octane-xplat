# `@octane-xplat/table`

Headless data grid for Octane xplat apps. The row model — sorting, filtering,
grouping, expanding, pagination, row selection, column ordering/visibility/
sizing — is `@tanstack/table-core` v9 (framework-agnostic, DOM-free), bound to
component rendering through TanStack Store atoms and `useSyncExternalStore`.
Rendering goes through shared ui primitives (`VirtualList` windowing on every
target), so one column/state contract covers web, iOS/Android, and macOS.

```sh
pnpm add @octane-xplat/table
```

```tsx
import { DataGrid } from '@octane-xplat/table'

;<DataGrid
	data={rows} // new array reference on change
	columns={[
		{ accessorKey: 'name', header: 'Name' },
		{ accessorKey: 'count', header: 'Count', size: 120 },
	]}
	onRowPress={(row) => row.toggleSelected()}
/>
```

`DataGrid` is the default presentation: `vx-table-*` chrome (shared with the
bounded `Table` primitive), header rows from `table.getHeaderGroups()`,
virtualized body rows. Sortable headers toggle on press.

For custom rendering keep the headless half and draw your own rows:

```tsx
const { table, state } = useTable({ data, columns })
// table.getRowModel().rows → memoized RowModel; state = flat TableState
```

`createTable` (no hooks) constructs the same instance for headless use.

## Feature surface

`dataGridFeatures` (the default set) enables every stock feature whose
machinery is DOM-free — sorting, column/global filtering, grouping +
aggregation, expanding, pagination, pinning, selection, column
ordering/visibility/sizing — plus the row-model factories and builtin
`sortFns`/`filterFns`/`aggregationFns` registries, which v9 keeps as separate
slots.

Not in the default set:

- `columnResizingFeature` — its drag handler installs `window` listeners;
  resize-gesture UI is a platform-leaf concern.
- `cellSelectionFeature` / `cellSpanningFeature` — range selection is
  spreadsheet-shaped; revisit per platform.

Pass `features` to add slots (e.g.
`features: { columnResizingFeature }` on a web-only surface).

## Controlled state

State slices live in `table.baseAtoms` (internal) with `table.atoms` as the
derived readonly view; `table.store` is the flat `TableState` store the
adapter subscribes to. Pair `state` + `atoms` (external `@tanstack/store`
atoms) for controlled slices, or subscribe `table.atoms.<slice>` directly.

## Boundaries

- Vertical virtualization only (VirtualList); no horizontal column
  virtualization, sticky pinning layout, or resize handles in v1.
- `Table` in `@octane-xplat/ui` stays the bounded, unvirtualized
  presentational tier — DataGrid is the data-grid tier above it.
