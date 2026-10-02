import type { Cell, Header, Row, RowData } from '@tanstack/table-core'
import { Pressable, Row as GridRow, Text, View, VirtualList } from '@octane-xplat/ui'
import { useTable } from './useTable.tsrx'
import type { DataGridProps, UseTable } from './props'

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

function cellStyle(column: { columnDef: { size?: number } }) {
	const size = column.columnDef.size
	return size != null ? { width: size, flexGrow: 0, flexShrink: 0 } : { flexGrow: 1 }
}

function sortIndicator(column: any) {
	const dir = column.getIsSorted?.()
	return dir === 'asc' ? ' ↑' : dir === 'desc' ? ' ↓' : ''
}

function DataGridHeaderCell(props: {
	header: Header<any, any, any>
	render?: DataGridProps['renderHeader']
	id?: string
	/** Flat TableState — prop identity forces re-eval of derived reads
	 *  (`getIsSorted`) on native, where unchanged-prop children are retained. */
	state: unknown
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

	const cls = 'vx-table-cell vx-table-th' + (canSort ? ' vx-table-th--sortable' : '')
	return canSort ? (
		<Pressable
			id={props.id}
			className={cls}
			style={cellStyle(column)}
			onPress={() => column.toggleSorting()}
			accessibilityRole="button"
		>
			{inner}
		</Pressable>
	) : (
		<View id={props.id} className={cls} style={cellStyle(column)}>
			{inner}
		</View>
	)
}

function DataGridBodyRow(props: {
	row: Row<any, any>
	renderCell?: DataGridProps['renderCell']
	onRowPress?: DataGridProps['onRowPress']
	idPrefix?: string
	/** See DataGridHeaderCell.state — forces re-eval of `getIsSelected`. */
	state: unknown
}) {
	const { row } = props
	void props.state
	const cells = row.getVisibleCells()
	const inner = (
		<>
			{cells.map((cell: Cell<any, any, any>) => (
				<View key={cell.id} className="vx-table-cell" style={cellStyle(cell.column)}>
					<TemplateContent
						content={
							props.renderCell
								? props.renderCell(cell)
								: (renderTemplate(cell.column.columnDef.cell, cell.getContext()) ?? cell.renderValue?.())
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
	return props.onRowPress ? (
		<Pressable
			id={id}
			className={cls}
			onPress={() => props.onRowPress!(row)}
			accessibilityState={{ selected: row.getIsSelected?.() || undefined }}
		>
			{inner}
		</Pressable>
	) : (
		<GridRow id={id} className={cls}>{inner}</GridRow>
	)
}

/** DataGrid — headless `@tanstack/table-core` row model (sorting, filtering,
 *  pagination, selection, grouping, expanding) over shared `VirtualList`
 *  windowing. One structure on every target; the columns/state contract is
 *  the library's `ColumnDef`s plus `TableState` slices. Large-column or
 *  platform-recycler presentations belong to platform subpaths. */
export function DataGrid<TData extends RowData = any>(props: DataGridProps<TData>) {
	const { table, state }: UseTable<any, TData> = useTable<TData>({
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
			style={[{ flexDirection: 'column', flexGrow: 1 }, props.style]}
			ios={props.ios}
			android={props.android}
			web={props.web}
			accessibilityRole={props.accessibilityRole as any}
			accessibilityLabel={props.accessibilityLabel}
		>
			{headerGroups.map((group) => (
				<GridRow key={group.id} className="vx-table-head">
					{group.headers.map((header: Header<any, any, any>) => (
						<DataGridHeaderCell
							key={header.id}
							header={header}
							render={props.renderHeader}
							id={props.id ? `${props.id}-th-${header.column.id}` : undefined}
							state={state}
						/>
					))}
				</GridRow>
			))}
			<VirtualList
				flexGrow={1}
				items={rows}
				keyExtractor={(row: Row<any, TData>) => row.id}
				renderItem={(row: Row<any, TData>) => (
					<DataGridBodyRow
						row={row}
						renderCell={props.renderCell}
						onRowPress={props.onRowPress}
						idPrefix={props.id}
						state={state}
					/>
				)}
				renderEmpty={props.renderEmpty}
			/>
		</View>
	)
}
