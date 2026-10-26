// Pagination plugin — port of upstream plugins/pagination/useTablePagination
// (Astryx 0.6.4, MIT). Renders xplat `Pagination` chrome around the table via
// `transformTableContext`. Upstream's `hasMore`, `onPageSizeChange`,
// `pageSizeOptions`, `variant`, `size`, and `label` options are accepted for
// shape parity but have no xplat `Pagination` equivalent yet — recorded gap.

import type { TablePlugin } from './types'
import { Pagination } from '../Pagination'
import { View } from '../View'

export interface UseTablePaginationConfig {
	/** Current page number (1-based). */
	page: number
	onPageChange: (page: number) => void
	totalItems?: number
	totalPages?: number
	hasMore?: boolean
	pageSize?: number
	onPageSizeChange?: (pageSize: number) => void
	pageSizeOptions?: number[]
	variant?: 'pages' | 'count' | 'compact' | 'dots' | 'none'
	size?: 'sm' | 'md'
	/** @default 'below' */
	position?: 'below' | 'above' | 'both' | 'none'
	/** @default 'center' */
	align?: 'start' | 'center' | 'end'
	label?: string
}

/** Pagination table plugin — renders Pagination controls around the table. */
export function useTablePagination<T extends Record<string, unknown>>(config: UseTablePaginationConfig): TablePlugin<T> {
	const configRef = { current: config }

	function renderPagination(labelSuffix?: string) {
		const c = configRef.current
		const pageSize = Number.isFinite(c.pageSize) ? Math.max(1, Math.floor(c.pageSize ?? 10)) : 10
		const totalPages = c.totalPages ?? (c.totalItems != null ? Math.ceil(c.totalItems / pageSize) : undefined)
		const isSinglePage = totalPages === 1 && c.hasMore !== true
		if (isSinglePage || totalPages == null || totalPages < 1) return null
		const align = c.align ?? 'center'
		return (
			<View className={`vx-table-pagination vx-table-pagination--${align}`}>
				<Pagination
					page={c.page}
					pageCount={totalPages}
					onPageChange={c.onPageChange}
					accessibilityLabel={labelSuffix ? `${c.label ?? 'Table pagination'} ${labelSuffix}` : (c.label ?? 'Table pagination')}
				/>
			</View>
		)
	}

	return {
		transformTableContext(children) {
			const pos = configRef.current.position ?? 'below'
			if (pos === 'none') return children
			const above = pos === 'above' || pos === 'both' ? renderPagination(pos === 'both' ? '(top)' : undefined) : null
			const below = pos === 'below' || pos === 'both' ? renderPagination(pos === 'both' ? '(bottom)' : undefined) : null
			if (!above && !below) return children
			return (
				<>
					{above}
					{children}
					{below}
				</>
			)
		},
	}
}
