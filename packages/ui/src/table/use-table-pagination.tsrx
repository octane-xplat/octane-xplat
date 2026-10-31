// Pagination plugin — port of upstream plugins/pagination/useTablePagination
// (Astryx 0.6.4, MIT). Renders xplat `Pagination` chrome around the table via
// `transformTableContext`. Upstream's `hasMore`, `onPageSizeChange`,
// `pageSizeOptions`, `variant`, `size`, and `label` options are accepted for
// shape parity but have no xplat `Pagination` equivalent yet — recorded gap.

import type { TablePlugin } from './types'
import { Pagination } from '../components/collections/Pagination'
import { View } from '../components/layout/View'
import { TableSlot, tableSlot } from './table-slot'

/** Pagination plugin config — controlled page state plus pager presentation options. */
export interface UseTablePaginationConfig {
	/** Current page number (1-based). */
	page: number
	/** Reports requested page changes — the controlled pair for `page`. */
	onPageChange: (page: number) => void
	/** Total row count — renders the "N items" summary. */
	totalItems?: number
	/** Total page count — required by numbered-page variants. */
	totalPages?: number
	/** Marks server-paged data where the last page is unknown — next stays enabled. */
	hasMore?: boolean
	/** Rows per page, when a page-size selector is shown. */
	pageSize?: number
	/** Reports page-size changes — the controlled pair for `pageSize`. */
	onPageSizeChange?: (pageSize: number) => void
	/** Choices shown by the page-size selector. */
	pageSizeOptions?: number[]
	/** Pager presentation; 'none' renders no pager. */
	variant?: 'pages' | 'count' | 'compact' | 'dots' | 'none'
	/** Pager control size. */
	size?: 'sm' | 'md'
	/** Pager placement relative to the table.
	 *  @default 'below' */
	position?: 'below' | 'above' | 'both' | 'none'
	/** Pager horizontal alignment.
	 *  @default 'center' */
	align?: 'start' | 'center' | 'end'
	/** Accessible label for the pager region. */
	label?: string
}

function TablePaginationBar(props: {
	configRef: { current: UseTablePaginationConfig }
	labelSuffix?: string
}) @{
	const c = props.configRef.current
	const pageSize = Number.isFinite(c.pageSize) ? Math.max(1, Math.floor(c.pageSize ?? 10)) : 10
	const totalPages =
		c.totalPages ?? (c.totalItems != null ? Math.ceil(c.totalItems / pageSize) : undefined)

	const isSinglePage = totalPages === 1 && c.hasMore !== true
	if (isSinglePage || totalPages == null || totalPages < 1) {
		return null as any
	}

	const align = c.align ?? 'center'
	const labelSuffix = props.labelSuffix

	<View className={`vx-table-pagination vx-table-pagination--${align}`}>
		<Pagination
			page={c.page}
			pageCount={totalPages}
			onPageChange={c.onPageChange}
			accessibilityLabel={
				labelSuffix
					? `${c.label ?? 'Table pagination'} ${labelSuffix}`
					: (c.label ?? 'Table pagination')
			}
		/>
	</View>
}

function TablePaginationChrome(props: {
	children: any
	configRef: { current: UseTablePaginationConfig }
}) @{
	const pos = props.configRef.current.position ?? 'below'
	const isBoth = pos === 'both'

	<>
		{pos === 'above' || isBoth ? (
			<TablePaginationBar configRef={props.configRef} labelSuffix={isBoth ? '(top)' : undefined} />
		) : null}
		<TableSlot value={props.children} />
		{pos === 'below' || isBoth ? (
			<TablePaginationBar
				configRef={props.configRef}
				labelSuffix={isBoth ? '(bottom)' : undefined}
			/>
		) : null}
	</>
}

/** Pagination table plugin — renders Pagination controls around the table. */
export function useTablePagination<T extends Record<string, unknown>>(
	config: UseTablePaginationConfig,
): TablePlugin<T> {
	const configRef = { current: config }

	return {
		transformTableContext(children) {
			const pos = configRef.current.position ?? 'below'
			if (pos === 'none') {
				return children
			}

			return tableSlot(TablePaginationChrome, { children, configRef })
		},
	}
}
