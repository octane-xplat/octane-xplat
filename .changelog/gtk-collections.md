### Collections and tables on GTK

GTK apps can now use the shared collections and table surface from
`@octane-xplat/ui`: `Collapsible`/`CollapsibleGroup`, `Accordion`,
`GridList`, `OverflowList`, `VirtualList`, `Carousel`, `TreeList`, the
full `Table` family (`TableHeader`/`TableBody`/`TableRow`/`TableCell`/
`TableHeaderCell`/`TableFooter`/`TableContext`/`TableSelectionToolbar`),
and the table plugin hooks (`useTableSortable`, `useTableSortableState`,
`useTableSelection`, `useTableSelectionState`, `useTableRowExpansion`,
`useTableRowIndex`, `useTableRowStatus`, `useTableFiltering`,
`useTableFilterState`, `useTableGroupedRows`, `useTableTreeState`,
`useTableTreeData`, `useTablePagination`, `useTableColumnSettings`,
`useTableColumnSettingsState`, `useTableColumnResize`,
`useTableStickyColumns`, `useGridList`).

```tsx
import {
	Table,
	proportional,
	useTableSelection,
	useTableSelectionState,
	useTableSortable,
	useTableSortableState,
} from "@octane-xplat/ui"

export function Roster({ people, selectedKeys, setSelectedKeys }) {
	const { selectionConfig, selectionState } = useTableSelectionState({
		data: people,
		idKey: "id",
		selectedKeys,
		setSelectedKeys,
	})
	const { sortedData, sortConfig } = useTableSortableState({ data: people })
	return (
		<Table
			data={sortedData}
			idKey="id"
			columns={[
				{ key: "name", header: "NAME", width: proportional(1), sortable: true },
				{ key: "team", header: "TEAM", width: proportional(1) },
			]}
			plugins={{
				sort: useTableSortable(sortConfig),
				selection: useTableSelection(selectionConfig),
			}}
		/>
	)
}
```

The shared contracts carry over unchanged: disclosure components track
open state, list components fire selection and action callbacks on real
input, `VirtualList`/`Carousel` expose `scrollToIndex`/`scrollTo` through
their handles, and table plugins drive sorting, row selection, expansion,
grouping, tree data, pagination, filtering, and column settings through
the same `plugins` map. `useGridList` stays an inert native leaf —
it reports `isSupported: false` on GTK, matching its behavior on other
native platforms. [GTK setup and limits](https://octane-xplat.goddardai.org/linux-gtk).
