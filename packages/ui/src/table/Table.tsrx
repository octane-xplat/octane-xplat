/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle } from '../internal/layout/style-merge'
import type {
	TableProps,
	TableColumn,
	TableHeaderProps,
	TableBodyProps,
	TableFooterProps,
	TableRowProps,
	TableCellProps,
	TableHeaderCellProps,
} from '../props'

import { cx } from '@octane-xplat/lib'
import { applyEscapeProps } from '../components/overlays/escape-props'
import { planTableRender, wrapTableContext, resolveTablePlugins, applyPlugins } from './pipeline'

import { TableContext, TableContextProvider } from './table-context'
import { TableSlot } from './table-slot'
import { useContext } from 'octane'

/** Column width → native cell style: pixel widths become dips, proportional
 *  shares become flexGrow. */
function cellWidthStyle(col: TableColumn<any>) {
	const w = col.width
	if (w?.type === 'pixel') {
		return { width: w.value }
	}

	return { flexGrow: w?.value ?? 1 }
}

function cellStyle(col: TableColumn<any>, extra?: Record<string, any>) {
	return {
		...cellWidthStyle(col),
		...(col.align === 'end'
			? { textAlignment: 'right' }
			: col.align === 'center'
				? { textAlignment: 'center' }
				: {}),
		...extra,
	}
}

function cellContent(content: any, col: TableColumn<any>) {
	// Strings/numbers render through <label>; elements pass through.
	return typeof content === 'string' || typeof content === 'number' ? (
		<label text={String(content)} />
	) : (
		<TableSlot value={content} />
	)
}

/** Table — data-driven + plugin pipeline (Astryx `Table`), universal leaf.
 *  Renders the same render plan as the web leaf mapped to flex rows; DOM-only
 *  plugin effects (resize drag handle, pointer context menus) degrade to
 *  their data effects (width overrides, injected columns, sort/selection/
 *  filter UI). */
export function Table<T extends Record<string, unknown> = Record<string, unknown>>(
	props: TableProps<T>,
): unknown @{
	const {
		data,
		columns,
		idKey,
		plugins: pluginRecord,
		density = 'balanced',
		dividers = 'rows',
		isStriped = false,
		hasHover = false,
		verticalAlign = 'middle',
		textOverflow = 'wrap',
		emptyState,
		rowIndexStart,
		rowCount,
		children,
		className,
		style,
		id,
		ref,
		...rest
	} = props

	const plugins = resolveTablePlugins<T>([], pluginRecord)
	const ctx = { density, dividers, isStriped, hasHover, verticalAlign, textOverflow }
	const tableClasses = cx(
		'vx-table',
		`vx-table--${density}`,
		`vx-table--dividers-${dividers}`,
		className,
	)

	if (children != null) {
		const table = applyPlugins(plugins, (p) => p.transformTable, {
			htmlProps: {},
			classes: [],
		} as any)

		const node = (
			<masonview
				ref={ref}
				id={id}
				className={cx(tableClasses, table.classes)}
				style={mergeStyle(
					{ display: 'flex', flexDirection: 'column' },
					mergeStyle(table.htmlProps?.style ?? {}, style),
				)}
			>
				{children}
			</masonview>
		)

		return (
			<TableContextProvider value={ctx}>
				<TableSlot value={wrapTableContext(plugins, node)} />
			</TableContextProvider>
		)
	}

	const plan = planTableRender<T>({
		data,
		columns,
		idKey: idKey as any,
		plugins,
		textOverflow,
		rowIndexStart,
		rowCount,
		emptyState,
	})

	const tableElement = (
		<masonview
			ref={(v: any) => applyEscapeProps(v, props)}
			id={id}
			className={cx('vx-table-scroll', plan.scrollWrapper.classes)}
			style={{ display: 'flex', flexDirection: 'column' }}
		>
			<TableSlot value={plan.scrollWrapper.beforeTable} />
			<masonview
				className={cx(tableClasses, plan.table.classes)}
				style={mergeStyle(
					{ display: 'flex', flexDirection: 'column' },
					mergeStyle(plan.table.htmlProps?.style ?? {}, style),
				)}
			>
				{plan.columns.length > 0 && (
					<masonview className="vx-table-head" style={{ display: 'flex', flexDirection: 'row' }}>
						{plan.headerCells.map((cell) => {
							const { before, after, overlay, below, content } = cell.render
							return (
								<masonview
									key={cell.column.key}
									className={cx(
										'vx-table-cell vx-table-th',
										`vx-table-cell--${density}`,
										cell.render.classes,
									)}
									style={mergeStyle(
										cellStyle(cell.column, { display: 'flex', flexDirection: 'column' }),
										cell.render.htmlProps?.style ?? {},
									)}
								>
									<TableSlot value={before} />
									<masonview
										style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}
									>
										{typeof content === 'string' ? (
											<label text={content} />
										) : (
											<TableSlot value={content} />
										)}
										<TableSlot value={after} />
									</masonview>
									<TableSlot value={below} />
								</masonview>
							)
						})}
					</masonview>
				)}
				{plan.rows.map((row) => {
					// Plugins may attach a row-level onClick (grouped header toggle,
					// tree row-click expansion) — map it to the native tap handler.
					const onRowTap =
						typeof row.render.htmlProps?.onClick === 'function'
							? row.render.htmlProps.onClick
							: undefined

					const rowNode = (
						<masonview
							key={String(row.key)}
							className={cx('vx-table-row', row.render.classes)}
							onTap={onRowTap}
							style={mergeStyle(
								{ display: 'flex', flexDirection: 'row' },
								row.render.htmlProps?.style ?? {},
							)}
						>
							{row.render.children != null ? (
								<TableSlot value={row.render.children} />
							) : (
								row.cells.map((cell) => (
									<masonview
										key={cell.column.key}
										className={cx(
											'vx-table-cell',
											`vx-table-cell--${density}`,
											cell.render.classes,
										)}
										style={mergeStyle(
											cellStyle(cell.column, { display: 'flex' }),
											cell.render.htmlProps?.style ?? {},
										)}
									>
										{cellContent(cell.content, cell.column)}
									</masonview>
								))
							)}
						</masonview>
					)

					return row.render.afterRow != null ? (
						<>
							{rowNode}
							<TableSlot value={row.render.afterRow} />
						</>
					) : (
						rowNode
					)
				})}
				{plan.showEmptyState && (
					<masonview className="vx-table-empty">
						{emptyState != null ? <TableSlot value={emptyState} /> : <label text="No data" />}
					</masonview>
				)}
			</masonview>
			<TableSlot value={plan.scrollWrapper.afterTable} />
		</masonview>
	)

	<TableContextProvider value={ctx}>
		<TableSlot value={wrapTableContext(plugins, tableElement)} />
	</TableContextProvider>
}

// =============================================================================
// Parts — children-mode composition (flex views)
// =============================================================================

/** Table head section — renders column header rows. */
export function TableHeader(props: TableHeaderProps): unknown @{
	<masonview className={cx('vx-table-header', props.className)} style={props.style}>
		{props.children}
	</masonview>
}

/** Table body section — renders data rows. */
export function TableBody(props: TableBodyProps): unknown @{
	<masonview className={cx('vx-table-body', props.className)} style={props.style}>
		{props.children}
	</masonview>
}

/** Table foot section — renders summary/footer rows. */
export function TableFooter(props: TableFooterProps): unknown @{
	<masonview className={cx('vx-table-footer', props.className)} style={props.style}>
		{props.children}
	</masonview>
}

/** One table row of cells. */
export function TableRow(props: TableRowProps): unknown @{
	const { isHeaderRow, children, className, style, ...rest } = props

	<masonview
		{...rest}
		className={cx('vx-table-row', className)}
		style={mergeStyle({ display: 'flex', flexDirection: 'row' }, style ?? {})}
	>
		{children}
	</masonview>
}

/** One body cell of a TableRow. */
export function TableCell(props: TableCellProps): unknown @{
	const { children, className, style, colSpan, ...rest } = props

	<masonview
		{...rest}
		className={cx('vx-table-cell', className)}
		style={mergeStyle({ display: 'flex', flexGrow: colSpan ?? 1 }, style ?? {})}
	>
		{children}
	</masonview>
}

/** One column header cell of a TableHeader. */
export function TableHeaderCell(props: TableHeaderCellProps): unknown @{
	const { children, className, style, ...rest } = props

	<masonview
		{...rest}
		className={cx('vx-table-cell vx-table-th', className)}
		style={mergeStyle({ display: 'flex' }, style ?? {})}
	>
		{children}
	</masonview>
}
