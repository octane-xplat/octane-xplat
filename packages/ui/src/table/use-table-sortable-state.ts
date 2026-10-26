// Sort state hook — port of upstream plugins/sortable/useTableSortableState
// (Astryx 0.6.4, MIT). Default comparator: Intl.Collator {numeric: true}.

import { useMemo, useRef, useState } from 'octane'
import type { TableSortState, TableSortComparator, UseTableSortableConfig } from './types'

export interface UseTableSortableStateConfig<
	T extends Record<string, unknown>,
	TSortKey extends string = string,
> {
	data: T[]
	defaultSort?: TableSortState<TSortKey>
	sort?: TableSortState<TSortKey>
	onSortChange?: (sort: TableSortState<TSortKey>) => void
	comparators?: Partial<Record<TSortKey, TableSortComparator<T>>>
	allowUnsortedState?: boolean
	isMultiSortEnabled?: boolean
}

export interface UseTableSortableStateResult<
	T extends Record<string, unknown>,
	TSortKey extends string = string,
> {
	sortedData: T[]
	sort: TableSortState<TSortKey>
	sortConfig: UseTableSortableConfig<TSortKey>
	applySort: (data: T[]) => T[]
}

function toSortableString(value: unknown): string {
	if (value instanceof Date) {return value.toISOString()}
	if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
		return String(value)
	}
	return ''
}

const collator = new Intl.Collator(undefined, { numeric: true })

function defaultCompare<T extends Record<string, unknown>>(a: T, b: T, sortKey: string): number {
	const aVal = a[sortKey]
	const bVal = b[sortKey]
	const aMissing = aVal == null || (typeof aVal === 'number' && Number.isNaN(aVal))
	const bMissing = bVal == null || (typeof bVal === 'number' && Number.isNaN(bVal))
	if (aMissing && bMissing) {return 0}
	if (aMissing) {return 1}
	if (bMissing) {return -1}
	if (typeof aVal === 'number' && typeof bVal === 'number') {return aVal - bVal}
	return collator.compare(toSortableString(aVal), toSortableString(bVal))
}

export function sortTableData<T extends Record<string, unknown>, TSortKey extends string = string>(
	data: T[],
	sortState: TableSortState<TSortKey>,
	comparators: Partial<Record<TSortKey, TableSortComparator<T>>> | undefined,
): T[] {
	if (sortState.length === 0) {return data}
	return [...data].sort((a, b) => {
		for (const entry of sortState) {
			const { sortKey, direction } = entry
			const customCmp = comparators?.[sortKey]
			const cmp = customCmp ? customCmp(a, b) : defaultCompare(a, b, sortKey)
			if (cmp !== 0) {return direction === 'ascending' ? cmp : -cmp}
		}
		return 0
	})
}

/** Manages sort state and applies local sort to data; produces the
 *  `sortConfig` consumed by `useTableSortable`. */
export function useTableSortableState<
	T extends Record<string, unknown>,
	TSortKey extends string = string,
>(config: UseTableSortableStateConfig<T, TSortKey>): UseTableSortableStateResult<T, TSortKey> {
	const {
		data,
		defaultSort = [],
		sort: controlledSort,
		onSortChange: controlledOnSortChange,
		comparators,
		allowUnsortedState,
		isMultiSortEnabled,
	} = config

	const [internalSort, setInternalSort] = useState<TableSortState<TSortKey>>(defaultSort)
	const isControlled = controlledSort !== undefined
	const sort = isControlled ? controlledSort : internalSort
	const onSortChange = isControlled ? (controlledOnSortChange ?? (() => {})) : setInternalSort

	const comparatorsRef = useRef(comparators)
	comparatorsRef.current = comparators
	const onSortChangeRef = useRef(onSortChange)
	onSortChangeRef.current = onSortChange

	const sortedData = useMemo(() => sortTableData(data, sort, comparatorsRef.current), [data, sort])
	const applySort = (inputData: T[]): T[] => sortTableData(inputData, sort, comparatorsRef.current)

	const sortConfig: UseTableSortableConfig<TSortKey> = {
		sort,
		onSortChange: (s) => onSortChangeRef.current(s),
		allowUnsortedState,
		isMultiSortEnabled,
	}

	return { sortedData, sort, sortConfig, applySort }
}
