/** @jsxImportSource @octane-xplat/jsx */
import './Table.macos.css'
import { useCallback, useRef, useState } from 'octane'
import { mergeStyle } from './style-merge'
import type {
	TableProps,
	TableColumn,
	TableHeaderProps,
	TableBodyProps,
	TableFooterProps,
	TableRowProps,
	TableCellProps,
	TableHeaderCellProps,
	TableTextOverflow,
} from './props'

import { cx } from '@octane-xplat/lib'
import { applyEscapeProps } from './escape-props'
import {
	planTableRender,
	wrapTableContext,
	resolveTablePlugins,
	applyPlugins,
} from './table/pipeline'

import { TableContext, TableContextProvider } from './table/table-context'
import { TableSlot } from './table/table-slot'
import { DEFAULT_MIN_COLUMN_WIDTH } from './table/column-utils'
import { refList } from './ref-list'

function cellWidthStyle(col: TableColumn<any>) {
	const w = col.width
	if (w?.type === 'pixel') return { width: w.value, minWidth: w.value, flexBasis: w.value, flexGrow: 0, flexShrink: 0 }
	return { flexBasis: 0, flexGrow: w?.value ?? 1, flexShrink: 0, minWidth: w ? w.minWidth ?? DEFAULT_MIN_COLUMN_WIDTH : 0 }
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

function AppKitTableCellContent(props: { value: unknown; overflow?: TableTextOverflow }) {
	return typeof props.value === 'string' || typeof props.value === 'number' ? (
		<label
			text={String(props.value)}
			className={props.overflow != null ? 'vx-table-cell-text--appkit' : undefined}
			maxLines={props.overflow === 'truncate' ? 1 : undefined}
			whiteSpace={props.overflow === 'truncate' ? 'nowrap' : props.overflow === 'wrap' ? 'normal' : undefined}
			textOverflow={props.overflow === 'truncate' ? 'ellipsis' : props.overflow === 'wrap' ? 'clip' : undefined}
		/>
	) : (
		<TableSlot value={props.value} />
	)
}

/** Table — data-driven + plugin pipeline (Astryx `Table`), AppKit leaf.
 *  Shared render plan mapped to flex views. Data mode owns a native horizontal
 *  viewport and default body text modes, and forwards cell refs to native
 *  plugins; their DOM-only props are outside the native safe subset. */
export function Table<T extends Record<string, unknown> = Record<string, unknown>>(
	props: TableProps<T>,
) @{
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

	const scrollViewport = useRef<NSScrollView | null>(null)
	const [viewportWidth, setViewportWidth] = useState(0)
	const measuredWidth = useRef(0)
	const measureViewport = useCallback(() => {
		const width = Number(scrollViewport.current?.contentView?.bounds?.size.width)
		if (Number.isFinite(width) && width > 0 && Math.abs(measuredWidth.current - width) >= 0.5) {
			measuredWidth.current = width
			setViewportWidth(width)
		}
	}, [])
	const bindViewport = useCallback((view: NSScrollView | null) => {
		scrollViewport.current = view
		if (view) measureViewport()
	}, [measureViewport])

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
		<scrollview
			ref={refList<NSScrollView>(plan.scrollWrapper.htmlProps?.ref, bindViewport, (view) => applyEscapeProps(view, props))}
			id={id}
			orientation="horizontal"
			onLayoutChanged={measureViewport}
			accessibilityLabel="Table"
			className={cx('vx-table-scroll', plan.scrollWrapper.classes)}
			style={mergeStyle({ display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '100%', minWidth: 0 }, plan.scrollWrapper.htmlProps?.style)}
		>
			<TableSlot value={plan.scrollWrapper.beforeTable} />
			<masonview
				ref={ref}
				className={cx(tableClasses, plan.table.classes)}
				style={mergeStyle(
					mergeStyle({ display: 'flex', flexDirection: 'column', width: Math.max(viewportWidth, plan.tableMinWidth) || '100%', flexShrink: 0 }, mergeStyle(plan.table.htmlProps?.style ?? {}, style)),
					plan.tableMinWidth > 0 ? { minWidth: plan.tableMinWidth } : {},
				)}
			>
				{plan.columns.length > 0 && (
					<masonview className="vx-table-head" style={{ display: 'flex', flexDirection: 'row' }}>
						{plan.headerCells.map((cell) => {
							const { before, after, below, content, overlay } = cell.render
							return (
								<masonview
									key={cell.column.key}
									ref={cell.render.htmlProps?.ref}
									className={cx(
										'vx-table-cell vx-table-th',
										`vx-table-cell--${density}`,
										cell.render.classes,
									)}
									style={mergeStyle(cellStyle(cell.column, { display: 'flex', flexDirection: 'column' }), cell.render.htmlProps?.style ?? {})}
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
									<TableSlot value={overlay} />
								</masonview>
							)
						})}
					</masonview>
				)}
				{plan.rows.map((row) => {
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
										ref={cell.render.htmlProps?.ref}
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
										<AppKitTableCellContent value={cell.content} overflow={cell.isDefaultRenderer ? textOverflow : undefined} />
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
		</scrollview>
	)

	<TableContextProvider value={ctx}>
		<TableSlot value={wrapTableContext(plugins, tableElement)} />
	</TableContextProvider>
}

export function TableHeader(props: TableHeaderProps) @{
	<masonview className={cx('vx-table-header', props.className)} style={props.style}>
		{props.children}
	</masonview>
}

export function TableBody(props: TableBodyProps) @{
	<masonview className={cx('vx-table-body', props.className)} style={props.style}>
		{props.children}
	</masonview>
}

export function TableFooter(props: TableFooterProps) @{
	<masonview className={cx('vx-table-footer', props.className)} style={props.style}>
		{props.children}
	</masonview>
}

export function TableRow(props: TableRowProps) @{
	const { children, className, style, ...rest } = props

	<masonview
		{...rest}
		className={cx('vx-table-row', className)}
		style={mergeStyle({ display: 'flex', flexDirection: 'row' }, style ?? {})}
	>
		{children}
	</masonview>
}

export function TableCell(props: TableCellProps) @{
	const { children, className, style, colSpan, ...rest } = props

	<masonview
		{...rest}
		className={cx('vx-table-cell', className)}
		style={mergeStyle({ display: 'flex', flexGrow: colSpan ?? 1 }, style ?? {})}
	>
		{children}
	</masonview>
}

export function TableHeaderCell(props: TableHeaderCellProps) @{
	const { children, className, style, ...rest } = props

	<masonview
		{...rest}
		className={cx('vx-table-cell vx-table-th', className)}
		style={mergeStyle({ display: 'flex' }, style ?? {})}
	>
		{children}
	</masonview>
}
