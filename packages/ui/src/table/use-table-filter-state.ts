// Filter state hook — port of upstream plugins/filtering/useTableFilterState
// (Astryx 0.6.4, MIT).

import { useState } from 'octane'
import type { TableFilterState, TableFilterValue } from './types'

/** useTableFilterState result — current filters plus mutators. */
export interface UseTableFilterStateResult {
	/** Applied filter values by column key. */
	filters: TableFilterState
	/** Sets one column's filter — null clears it. */
	onFilterChange: (key: string, value: TableFilterValue | null) => void
	/** Clears every applied filter. */
	clearAll: () => void
}

/** Manages the column-filter state map passed to `useTableFiltering`. */
export function useTableFilterState(initialState?: TableFilterState): UseTableFilterStateResult {
	const [filters, setFilters] = useState<TableFilterState>(initialState ?? {})

	const onFilterChange = (key: string, value: TableFilterValue | null) => {
		setFilters((prev: TableFilterState) => {
			if (value == null) {
				const next = { ...prev }
				delete next[key]
				return next
			}
			return { ...prev, [key]: value }
		})
	}

	const clearAll = () => setFilters({})

	return { filters, onFilterChange, clearAll }
}
