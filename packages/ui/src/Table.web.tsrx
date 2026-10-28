import { cx } from '@octane-xplat/lib'
import { mergeStyle } from './style-merge'
import { applyEscapeProps } from './escape-props'
import type {
	TableProps,
	TableHeaderProps,
	TableBodyProps,
	TableFooterProps,
	TableRowProps,
	TableCellProps,
	TableHeaderCellProps,
} from './props'

import type { TableContextActions, TablePlugin, TableRenderProps } from './table/types'
import {
	applyPlugins,
	planTableRender,
	wrapTableContext,
	resolveTablePlugins,
} from './table/pipeline'

import { TableContext, TableContextProvider } from './table/table-context'
import { TableSlot } from './table/table-slot'
import { Empty as EmptyState } from './Empty'
import { ContextMenu } from './ContextMenu'
import { useContext } from 'octane'

function resolveContextActions(actions: TableContextActions | undefined) {
	if (!actions) {
		return undefined
	}

	const list = typeof actions === 'function' ? actions() : actions
	if (!list || list.length === 0) {
		return undefined
	}

	const items: any[] = []
	let lastGroup: string | undefined
	for (const action of list) {
		if (items.length > 0 && action.group !== lastGroup) {
			items.push({ type: 'divider' })
		}

		lastGroup = action.group
		items.push({
			type: 'action',
			label: action.label,
			icon: action.icon,
			onSelect: action.onSelect,
			isDisabled: action.disabled,
			isChecked: action.checked,
			variant: action.variant === 'destructive' ? 'destructive' : undefined,
		})
	}

	return items
}

function CellContextMenu(props: {
	actions: TableContextActions | undefined
	children: any
}) @{
	const items = resolveContextActions(props.actions)

	@if (items) {
		<ContextMenu menu={items}>{props.children}</ContextMenu>
	} @else {
		<>{props.children}</>
	}
}

function ctxClasses(ctx: any, isHeaderRow: boolean) {
	if (!ctx || isHeaderRow) {
		return ''
	}

	return [
		ctx.isStriped && ctx.hasHover && 'vx-table-row--striped-hover',
		ctx.isStriped && !ctx.hasHover && 'vx-table-row--striped',
		ctx.hasHover && !ctx.isStriped && 'vx-table-row--hover',
	]
		.filter(Boolean)
		.join(' ')
}

/** Table — data-driven + plugin pipeline (Astryx `Table`), semantic DOM leaf. */
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

	const plugins = resolveTablePlugins<T>([], pluginRecord)
	const ctx = { density, dividers, isStriped, hasHover, verticalAlign, textOverflow }
	const overflowClass =
		textOverflow === 'truncate' ? 'vx-table-cell--truncate' : 'vx-table-cell--wrap'

	const tableClasses = cx(
		'vx-table',
		`vx-table--${density}`,
		`vx-table--dividers-${dividers}`,
		`vx-table--valign-${verticalAlign}`,
		className,
	)

	if (children != null) {
		const table = applyPlugins(plugins, (p) => p.transformTable, {
			htmlProps: {},
			classes: [],
		} as TableRenderProps)

		const node = (
			<div class="vx-table-scroll">
				<table
					ref={ref}
					id={id}
					{...table.htmlProps}
					class={cx(tableClasses, table.classes)}
					style={mergeStyle(
						(table.htmlProps?.style ?? {}) as Record<string, unknown>,
						(style ?? {}) as Record<string, unknown>,
					)}
				>
					{children}
				</table>
			</div>
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

	const tableStyle = mergeStyle(
		mergeStyle(
			(plan.table.htmlProps?.style ?? {}) as Record<string, unknown>,
			(style ?? {}) as Record<string, unknown>,
		),
		(plan.tableMinWidth > 0 ? { minWidth: `${plan.tableMinWidth}px` } : {}) as Record<
			string,
			unknown
		>,
	) as Record<string, unknown>

	// Extract a plugin-contributed ref so it reliably binds to the scroll div
	// (sticky-columns attaches scroll/resize listeners through it).
	const { ref: scrollWrapperRef, ...scrollWrapperProps } = plan.scrollWrapper.htmlProps ?? {}

	const tableElement = (
		<div
			ref={scrollWrapperRef as any}
			{...scrollWrapperProps}
			class={cx('vx-table-scroll', plan.scrollWrapper.classes)}
			role="group"
			aria-label="Table"
		>
			<TableSlot value={plan.scrollWrapper.beforeTable} />
			<table
				ref={ref}
				id={id}
				{...plan.table.htmlProps}
				class={cx(tableClasses, plan.table.classes)}
				style={tableStyle}
				{...rest}
			>
				{plan.columns.length > 0 && (
					<thead>
						<tr {...plan.headerRow.htmlProps} class={cx(plan.headerRow.classes)}>
							{plan.headerCells.map((cell) => {
								const { before, after, overlay, below, content } = cell.render
								const hasSlots = before != null || after != null || overlay != null || below != null
								return (
									<th
										key={cell.column.key}
										{...cell.render.htmlProps}
										class={cx(
											'vx-table-cell vx-table-th',
											`vx-table-cell--${density}`,
											overflowClass,
											cell.render.classes,
										)}
										style={mergeStyle(
											cell.widthStyle,
											(cell.render.htmlProps?.style ?? {}) as Record<string, unknown>,
										)}
										title={typeof content === 'string' && content.length > 0 ? content : undefined}
									>
										{hasSlots ? (
											<>
												<TableSlot value={before} />
												{after != null ? (
													<div class="vx-table-header-label">
														<TableSlot value={content} />
														<TableSlot value={after} />
													</div>
												) : (
													<TableSlot value={content} />
												)}
												<TableSlot value={overlay} />
												<TableSlot value={below} />
											</>
										) : (
											<TableSlot value={content} />
										)}
									</th>
								)
							})}
						</tr>
					</thead>
				)}
				<tbody>
					{plan.rows.map((row) => {
						const rowNode = (
							<tr
								key={row.key}
								{...row.render.htmlProps}
								class={cx('vx-table-row', ctxClasses(ctx, false), row.render.classes)}
							>
								{row.render.children != null
									? (row.render.children as any)
									: row.cells.map((cell) => (
											<td
												key={cell.column.key}
												{...cell.render.htmlProps}
												class={cx(
													'vx-table-cell',
													`vx-table-cell--${density}`,
													overflowClass,
													cell.render.classes,
												)}
												style={cell.render.htmlProps?.style}
											>
												{cell.render.contextMenuActions ? (
													<CellContextMenu actions={cell.render.contextMenuActions}>
														<TableSlot value={cell.content} />
													</CellContextMenu>
												) : (
													<TableSlot value={cell.content} />
												)}
											</td>
										))}
							</tr>
						)

						return row.render.afterRow ? (
							<>
								{rowNode}
								<TableSlot value={row.render.afterRow} />
							</>
						) : (
							rowNode
						)
					})}
					{plan.showEmptyState && (
						<tr>
							<td colSpan={plan.colSpan}>
								{emptyState != null ? (
									<TableSlot value={emptyState} />
								) : (
									<EmptyState title="No data" />
								)}
							</td>
						</tr>
					)}
				</tbody>
			</table>
			<TableSlot value={plan.scrollWrapper.afterTable} />
		</div>
	)

	<TableContextProvider value={ctx}>
		<TableSlot value={wrapTableContext(plugins, tableElement)} />
	</TableContextProvider>
}

// =============================================================================
// Parts — children-mode composition (semantic table elements on web)
// =============================================================================

export function TableHeader(props: TableHeaderProps) @{
	<thead {...props.web} class={cx('vx-table-header', props.className)} style={props.style}>
		{props.children as any}
	</thead>
}

export function TableBody(props: TableBodyProps) @{
	<tbody {...props.web} class={cx('vx-table-body', props.className)} style={props.style}>
		{props.children as any}
	</tbody>
}

export function TableFooter(props: TableFooterProps) @{
	<tfoot {...props.web} class={cx('vx-table-footer', props.className)} style={props.style}>
		{props.children as any}
	</tfoot>
}

export function TableRow(props: TableRowProps) @{
	const ctx = useContext(TableContext as any) as any
	const { isHeaderRow, contextMenuActions, children, className, style, web, ...rest } = props

	<tr
		{...rest}
		{...web}
		class={cx('vx-table-row', ctxClasses(ctx, !!isHeaderRow), className)}
		style={style}
	>
		{children as any}
	</tr>
}

export function TableCell(props: TableCellProps) @{
	const ctx = useContext(TableContext as any) as any
	const {
		contextMenuActions,
		children,
		className,
		style,
		scope,
		headers,
		colSpan,
		rowSpan,
		web,
		...rest
	} = props

	<td
		{...rest}
		{...web}
		scope={scope}
		headers={headers}
		colSpan={colSpan}
		rowSpan={rowSpan}
		class={cx(
			'vx-table-cell',
			`vx-table-cell--${ctx?.density ?? 'balanced'}`,
			ctx?.textOverflow === 'truncate' ? 'vx-table-cell--truncate' : 'vx-table-cell--wrap',
			(ctx?.dividers === 'columns' || ctx?.dividers === 'grid') && 'vx-table-cell--col-divider',
			(ctx?.dividers === 'rows' || ctx?.dividers === 'grid') && 'vx-table-cell--row-divider',
			className,
		)}
		style={mergeStyle(
			(ctx?.verticalAlign ? { verticalAlign: ctx.verticalAlign } : {}) as Record<string, unknown>,
			(style ?? {}) as Record<string, unknown>,
		)}
	>
		<CellContextMenu actions={contextMenuActions}>{children as any}</CellContextMenu>
	</td>
}

export function TableHeaderCell(props: TableHeaderCellProps) @{
	const ctx = useContext(TableContext as any) as any
	const {
		contextMenuActions,
		children,
		className,
		style,
		scope,
		headers,
		colSpan,
		rowSpan,
		web,
		...rest
	} = props

	<th
		{...rest}
		{...web}
		scope={scope ?? 'col'}
		headers={headers}
		colSpan={colSpan}
		rowSpan={rowSpan}
		class={cx(
			'vx-table-cell vx-table-th',
			`vx-table-cell--${ctx?.density ?? 'balanced'}`,
			(ctx?.dividers === 'columns' || ctx?.dividers === 'grid') && 'vx-table-cell--col-divider',
			(ctx?.dividers === 'rows' || ctx?.dividers === 'grid') && 'vx-table-cell--row-divider',
			className,
		)}
		style={mergeStyle(
			{ verticalAlign: ctx?.verticalAlign ?? 'middle' },
			(style ?? {}) as Record<string, unknown>,
		)}
	>
		<CellContextMenu actions={contextMenuActions}>{children as any}</CellContextMenu>
	</th>
}
