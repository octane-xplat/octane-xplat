import type { Cell, Header, Row, RowData } from '@tanstack/table-core'
import {
	CheckboxInput as Checkbox,
	Pressable,
	HStack as GridRow,
	Text,
	TextInput,
	View,
	VirtualList,
} from '@octane-xplat/ui'

import { useTable } from './useTable.tsrx'
import type { DataGridProps, UseTable } from './props'
import type { DataGridFeatures } from './table'
import { columnStyle } from './grid-layout'
import { ColumnDrag } from './ColumnDrag.tsrx'
import { GridControls, GridPagination } from './GridControls.tsrx'

/** Evaluates a column `cell`/`header` template (string | fn → node) — the
 *  DOM-free half of table-core's `flexRender`. */
function renderTemplate(template: any, ctx: any) {
	if (template == null) return null
	return typeof template === 'function' ? template(ctx) : template
}

/** Primitive template results draw as Text; nodes pass through. */
function TemplateContent(props: { content: any }) {
	const content = props.content
	if (content == null || content === false) return null
	if (typeof content === 'string' || typeof content === 'number' || typeof content === 'bigint') {
		return <Text>{String(content)}</Text>
	}

	return content
}

function sortIndicator(column: any) {
	const dir = column.getIsSorted?.()
	return dir === 'asc' ? ' ↑' : dir === 'desc' ? ' ↓' : ''
}

function DataGridHeaderCell<TData extends RowData>(props: {
	header: Header<DataGridFeatures, TData, any>
	render?: DataGridProps<TData>['renderHeader']
	id?: string
	/** Flat TableState — prop identity forces re-eval of derived reads
	 *  (`getIsSorted`) on native, where unchanged-prop children are retained. */
	state: any
	table: any
	filters?: boolean
	resize?: boolean
	reorder?: boolean
	direction?: 'ltr' | 'rtl'
}) {
	const { header } = props
	void props.state
	const column = header.column as any
	const canSort = !header.isPlaceholder && column.getCanSort?.() === true
	const content = props.render
		? props.render(header)
		: (renderTemplate(column.columnDef.header, header.getContext()) ?? column.id)

	const isPrimitive =
		typeof content === 'string' || typeof content === 'number' || typeof content === 'bigint'

	// Native Labels can't host span/element children — primitives join the
	// indicator text inside one Text; nodes become siblings of it.
	const inner = isPrimitive ? (
		<Text>
			{String(content)}
			{canSort ? sortIndicator(column) : ''}
		</Text>
	) : (
		<>
			<TemplateContent content={content} />
			{canSort ? <Text>{sortIndicator(column)}</Text> : null}
		</>
	)

	const cls = 'vx-table-cell vx-table-th'
	return (
		<View
			className={cls}
			style={columnStyle(column, Boolean(props.resize || props.reorder), props.state.columnSizing)}
		>
			{canSort ? (
				<Pressable
					id={props.id}
					className="vx-table-th--sortable"
					onPress={() => column.toggleSorting()}
					accessibilityLabel={`Sort ${column.id}, ${column.getIsSorted() || 'unsorted'}`}
				>
					<>{inner}</>
				</Pressable>
			) : (
				<View id={props.id}>{inner}</View>
			)}
			{!header.isPlaceholder && props.filters && column.getCanFilter() ? (
				<TextInput
					id={props.id ? `${props.id}-filter` : undefined}
					value={String(column.getFilterValue() ?? '')}
					placeholder={`Filter ${column.id}`}
					accessibilityLabel={`Filter ${column.id}`}
					onChange={(value) => {
						column.setFilterValue(value)
						props.table.setPageIndex(0)
					}}
				/>
			) : null}
			{!header.isPlaceholder && column.columns.length === 0 && (props.resize || props.reorder) ? (
				<ColumnDrag
					id={props.id}
					table={props.table}
					column={column}
					resize={props.resize}
					reorder={props.reorder}
					direction={props.direction}
					state={props.state}
				/>
			) : null}
		</View>
	)
}

function DataGridBodyRow<TData extends RowData>(props: {
	row: Row<DataGridFeatures, TData>
	renderCell?: DataGridProps<TData>['renderCell']
	onRowPress?: DataGridProps<TData>['onRowPress']
	idPrefix?: string
	/** See DataGridHeaderCell.state — forces re-eval of `getIsSelected`. */
	state: any
	selection?: boolean
	fixed?: boolean
	getRowLabel?: (row: any) => string
}) {
	const { row } = props
	void props.state
	const cells = row.getVisibleCells()
	const inner = (
		<>
			{cells.map((cell: Cell<DataGridFeatures, TData, any>) => (
				<View
					key={cell.id}
					className="vx-table-cell"
					style={columnStyle(cell.column, Boolean(props.fixed), props.state.columnSizing)}
				>
					<TemplateContent
						content={
							props.renderCell
								? props.renderCell(cell)
								: (renderTemplate(cell.column.columnDef.cell, cell.getContext()) ??
									cell.renderValue?.())
						}
					/>
				</View>
			))}
		</>
	)

	const cls =
		'vx-table-row' +
		(props.onRowPress ? ' vx-table-row--pressable' : '') +
		(row.getIsSelected?.() ? ' vx-table-row--selected' : '')

	const id = props.idPrefix ? `${props.idPrefix}-row-${row.id}` : undefined
	const content = props.onRowPress ? (
		<Pressable
			id={props.selection ? undefined : id}
			className="vx-datagrid-row-action"
			onPress={() => props.onRowPress!(row)}
			accessibilityState={{ selected: row.getIsSelected?.() || undefined }}
		>
			{inner}
		</Pressable>
	) : (
		inner
	)

	return (
		<GridRow
			id={props.selection || !props.onRowPress ? id : undefined}
			className={cls}
			accessibilityState={{ selected: row.getIsSelected?.() || undefined }}
		>
			{props.selection ? (
				<View className="vx-datagrid-selection">
					<Checkbox
						id={props.idPrefix ? `${props.idPrefix}-select-${row.id}` : undefined}
						checked={row.getIsSelected()}
						isDisabled={!row.getCanSelect()}
						accessibilityLabel={`Select ${props.getRowLabel?.(row) ?? row.id}`}
						onCheckedChange={(checked) => row.toggleSelected(checked)}
					/>
				</View>
			) : null}
			{content}
		</GridRow>
	)
}

/** DataGrid — headless `@tanstack/table-core` row model (sorting, filtering,
 *  pagination, selection, grouping, expanding) over shared `VirtualList`
 *  windowing. One structure on every target; the columns/state contract is
 *  the library's `ColumnDef`s plus `TableState` slices. Large-column or
 *  platform-recycler presentations belong to platform subpaths. */
export function DataGrid<TData extends RowData = any>(props: DataGridProps<TData>) {
	const { table, state }: UseTable<DataGridFeatures, TData> = useTable<TData, DataGridFeatures>({
		...props.options,
		defaultColumn: props.showColumnFilters
			? { filterFn: 'includesString', ...props.options?.defaultColumn }
			: props.options?.defaultColumn,
		data: props.data,
		columns: props.columns as any,
		features: props.features as any,
		initialState: props.initialState as any,
		state: props.state as any,
		getRowId: props.getRowId,
	})

	const headerGroups = table.getHeaderGroups()
	const rows = table.getRowModel().rows
	return (
		<View
			id={props.id}
			className={['vx-table', 'vx-datagrid', props.className]}
			style={props.style}
			flexGrow={props.flexGrow ?? 1}
			flexShrink={props.flexShrink}
			alignSelf={props.alignSelf}
			row={props.row}
			col={props.col}
			rowSpan={props.rowSpan}
			colSpan={props.colSpan}
			ios={props.ios}
			android={props.android}
			web={props.web}
			accessibilityRole={props.accessibilityRole as any}
			accessibilityLabel={props.accessibilityLabel}
		>
			{props.showGlobalFilter || props.showColumnSettings ? (
				<GridControls
					id={props.id}
					table={table}
					state={state}
					search={props.showGlobalFilter}
					settings={props.showColumnSettings}
				/>
			) : null}
			{props.showRowSelection ? (
				<GridRow className="vx-datagrid-controls">
					<Text id={props.id ? `${props.id}-selected-count` : undefined}>
						{Object.values(state.rowSelection).filter(Boolean).length} selected
					</Text>
					<Pressable
						id={props.id ? `${props.id}-clear-selection` : undefined}
						className="vx-datagrid-action"
						onPress={() => table.resetRowSelection(true)}
						accessibilityLabel="Clear selection"
					>
						<Text>Clear selection</Text>
					</Pressable>
					{props.renderSelectionActions?.(table)}
				</GridRow>
			) : null}
			<View id={props.id ? `${props.id}-header` : undefined} flexShrink={0}>
				{headerGroups.map((group) => (
					<GridRow key={group.id} className="vx-table-head">
						{props.showRowSelection ? (
							<View className="vx-datagrid-selection">
								{group.depth === 0 ? (
									<Checkbox
										id={props.id ? `${props.id}-select-page` : undefined}
										checked={table.getIsAllPageRowsSelected()}
										indeterminate={table.getIsSomePageRowsSelected()}
										isDisabled={!rows.some((row) => row.getCanSelect())}
										accessibilityLabel="Select current page"
										onCheckedChange={(checked) => table.toggleAllPageRowsSelected(checked)}
									/>
								) : null}
							</View>
						) : null}
						{group.headers.map((header: Header<DataGridFeatures, TData, any>) => (
							<DataGridHeaderCell
								key={header.id}
								header={header}
								render={props.renderHeader}
								id={props.id ? `${props.id}-th-${header.column.id}` : undefined}
								state={state}
								table={table}
								filters={props.showColumnFilters}
								resize={props.resizableColumns}
								reorder={props.reorderableColumns}
								direction={props.direction}
							/>
						))}
					</GridRow>
				))}
			</View>
			<VirtualList
				flexGrow={1}
				className="vx-datagrid-body"
				id={props.id ? `${props.id}-body` : undefined}
				items={rows}
				keyExtractor={(row: Row<DataGridFeatures, TData>) => row.id}
				renderItem={(row: Row<DataGridFeatures, TData>) => (
					<DataGridBodyRow
						row={row}
						renderCell={props.renderCell}
						onRowPress={props.onRowPress}
						idPrefix={props.id}
						state={state}
						selection={props.showRowSelection}
						getRowLabel={props.getRowLabel}
						fixed={Boolean(props.resizableColumns || props.reorderableColumns)}
					/>
				)}
				renderEmpty={props.renderEmpty}
			/>
			{props.showPagination ? (
				<GridPagination id={props.id} table={table} state={state} sizes={props.pageSizeOptions} />
			) : null}
		</View>
	)
}
