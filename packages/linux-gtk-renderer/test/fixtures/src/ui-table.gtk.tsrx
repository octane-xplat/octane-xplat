/** @jsxImportSource @octane-xplat/jsx */
import { useContext, useState } from 'octane'
import {
	createPowerSearchConfig,
	pixel,
	proportional,
	Pressable,
	Table,
	TableBody,
	TableCell,
	TableContext,
	TableFooter,
	TableHeader,
	TableHeaderCell,
	TableRow,
	TableSelectionToolbar,
	Text,
	useTableColumnResize,
	useTableColumnSettings,
	useTableColumnSettingsState,
	useTableFilterState,
	useTableFiltering,
	useTableGroupedRows,
	useTablePagination,
	useTableRowExpansion,
	useTableRowIndex,
	useTableRowStatus,
	useTableSelection,
	useTableSelectionState,
	useTableSortable,
	useTableSortableState,
	useTableStickyColumns,
	useTableTreeData,
	useTableTreeState,
	View,
} from '@octane-xplat/ui'

export const events: string[] = []
export const state: Record<string, any> = {
	tableCtx: null,
	sortChange: null,
	selectionCount: 0,
	filterApplied: null,
	columnKeys: null,
	settings: null,
	expanded: null,
	treeExpanded: null,
	collapsedGroups: null,
	page: 1,
}

const people = [
	{ id: 'p1', name: 'Zeta', age: 41, team: 'eng' },
	{ id: 'p2', name: 'Alfred', age: 23, team: 'ops' },
	{ id: 'p3', name: 'Mira', age: 35, team: 'eng' },
	{ id: 'p4', name: 'Bob', age: 29, team: 'ops' },
]

const { config: searchConfig } = createPowerSearchConfig([
	{ key: 'name', type: 'string', label: 'Name' },
])

function ContextProbe() {
	state.tableCtx = useContext(TableContext)
	return null
}

function MainTable() @{
	const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set())
	const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set())
	const { selectionConfig, selectionState } = useTableSelectionState({
		data: people,
		idKey: 'id',
		selectedKeys,
		setSelectedKeys,
	})
	state.selectionCount = selectionState.selectedCount
	const [sortKeys, setSortKeys] = useState<any[]>([])
	const { sortedData, sortConfig } = useTableSortableState<Record<string, any>>({
		data: people,
		sort: sortKeys,
		onSortChange: (sort: any) => {
			state.sortChange = JSON.stringify(sort)
			setSortKeys(sort)
		},
	})
	const { filters, onFilterChange } = useTableFilterState()
	state.filterApplied = JSON.stringify(filters)
	const shownData = sortedData.filter(
		(row: any) =>
			filters.name == null || String(row.name).toLowerCase().includes(String(filters.name).toLowerCase()),
	)
	const plugins = {
		sort: useTableSortable(sortConfig),
		selection: useTableSelection(selectionConfig),
		index: useTableRowIndex({ data: shownData }),
		status: useTableRowStatus({
			getStatus: (item: any) =>
				item.id === 'p1' ? { status: 'warning', label: 'Watch row' } : null,
		}),
		expansion: useTableRowExpansion({
			getRowKey: (item: any) => item.id,
			expandedKeys,
			onToggle: (key: string) => {
				setExpandedKeys((prev: Set<string>) => {
					const next = new Set(prev)
					if (next.has(key)) {
						next.delete(key)
					} else {
						next.add(key)
					}
					state.expanded = [...next]
					return next
				})
			},
			renderExpanded: (item: any) => <Text>{'DETAIL ' + item.name}</Text>,
		}),
		filtering: useTableFiltering({ filters, onFilterChange, searchConfig }),
	}

	<View style={{ flexDirection: 'column' }}>
		<TableSelectionToolbar selection={selectionState} />
		<Table
			id="main-table"
			data={shownData}
			columns={[
				{ key: 'name', header: 'NAME', width: proportional(1), sortable: true, filter: 'name' },
				{ key: 'age', header: 'AGE', width: pixel(70), sortable: true },
				{ key: 'team', header: 'TEAM', width: proportional(1) },
			]}
			idKey="id"
			plugins={plugins}
		/>
	</View>
}

function GroupedTable() @{
	const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
	const grouped = useTableGroupedRows({
		data: people,
		groupBy: (item: any) => item.team,
		collapsedGroups: collapsed,
		onToggleGroup: (key: string) => {
			setCollapsed((prev: Set<string>) => {
				const next = new Set(prev)
				if (next.has(key)) {
					next.delete(key)
				} else {
					next.add(key)
				}
				state.collapsedGroups = [...next]
				return next
			})
		},
	})

	<Table
		id="group-table"
		data={grouped.data}
		idKey={grouped.idKey}
		columns={[{ key: 'name', header: 'NAME', width: proportional(1) }]}
		plugins={{ grouped: grouped.plugin }}
	/>
}

const treeRows = [
	{
		id: 'r1',
		name: 'ROOT ROW',
		children: [
			{ id: 'r1a', name: 'CHILD ROW A' },
			{ id: 'r1b', name: 'CHILD ROW B' },
		],
	},
	{ id: 'r2', name: 'FLAT ROW' },
]

function TreeTable() @{
	const tree = useTableTreeState<Record<string, any>>({
		data: treeRows,
		idKey: 'id',
		onExpandedIdsChange: (ids: ReadonlySet<string>) => {
			state.treeExpanded = [...ids]
		},
	})

	<Table
		id="tree-table"
		data={tree.visibleData}
		idKey="id"
		columns={[{ key: 'name', header: 'NAME', width: proportional(1) }]}
		plugins={{ tree: useTableTreeData(tree.treeConfig) }}
	/>
}

function PagedTable() @{
	const [page, setPage] = useState(1)
	state.page = page
	const pageSize = 2
	const totalItems = people.length
	const pageData = people.slice((page - 1) * pageSize, page * pageSize)

	<Table
		id="paged-table"
		data={pageData}
		columns={[{ key: 'name', header: 'NAME', width: proportional(1) }]}
		idKey="id"
		plugins={{
			pagination: useTablePagination({
				page,
				totalItems,
				pageSize,
				onPageChange: setPage,
			}),
		}}
	/>
}

function SettingsTable() @{
	const [activeColumnKeys, setActiveColumnKeys] = useState<string[]>(['name', 'age', 'team'])
	state.columnKeys = activeColumnKeys
	const settings = useTableColumnSettingsState({
		columns: [
			{ key: 'name', label: 'Name', isAlwaysVisible: true },
			{ key: 'age', label: 'Age' },
			{ key: 'team', label: 'Team' },
		],
		activeColumnKeys,
		onChangeActiveColumnKeys: (keys: ReadonlyArray<string>) => setActiveColumnKeys([...keys]),
	})
	state.settings = {
		toggleColumn: settings.toggleColumn,
		showAllColumns: settings.showAllColumns,
		resetToDefault: settings.resetToDefault,
		isColumnActive: settings.isColumnActive,
	}

	<View style={{ flexDirection: 'column' }}>
		<Pressable
			id="col-toggle"
			onPress={() => settings.toggleColumn('team')}
			style={{ padding: 6 }}
		>
			<Text>TOGGLE TEAM COL</Text>
		</Pressable>
		<Table
			id="settings-table"
			data={people}
			columns={[
				{ key: 'name', header: 'SNAME', width: proportional(1) },
				{ key: 'age', header: 'SAGE', width: pixel(80) },
				{ key: 'team', header: 'STEAM', width: proportional(1) },
			]}
			idKey="id"
			plugins={{
				settings: useTableColumnSettings(settings.columnSettingsConfig),
				resize: useTableColumnResize({ columnWidths: { age: 60 } }),
				sticky: useTableStickyColumns({ startKeys: ['name'] }),
			}}
		/>
	</View>
}

export function TableProbe() @{
	<View style={{ flexDirection: 'column', width: 900 }}>
		<MainTable />
		<Table id="parts-table" density="compact" dividers="grid">
			<ContextProbe />
			<TableHeader>
				<TableRow>
					<TableHeaderCell>
						<Text>PART H1</Text>
					</TableHeaderCell>
					<TableHeaderCell>
						<Text>PART H2</Text>
					</TableHeaderCell>
				</TableRow>
			</TableHeader>
			<TableBody>
				<TableRow>
					<TableCell>
						<Text>PART A1</Text>
					</TableCell>
					<TableCell>
						<Text>PART A2</Text>
					</TableCell>
				</TableRow>
			</TableBody>
			<TableFooter>
				<TableRow>
					<TableCell>
						<Text>PART F1</Text>
					</TableCell>
				</TableRow>
			</TableFooter>
		</Table>
		<GroupedTable />
		<TreeTable />
		<PagedTable />
		<SettingsTable />
	</View>
}
