import { useCallback, useState, useSyncExternalStore } from 'octane'
import type { RowData, TableFeatures } from '@tanstack/table-core'
import { createTable, type DataGridFeatures } from './table'
import type { DataGridOptions, UseTable } from './props'

/**
 * Create a table instance bound to component rendering. The instance is
 * constructed once; each render syncs `data`/`columns`/`state`/etc. into the
 * options store (feature slots and `initialState` are first-render only).
 *
 * Re-render triggers: any `TableState` slice change (sorting, selection,
 * filters, pagination, ...) through `table.store`, plus ordinary prop-driven
 * renders for `data`/`columns` changes. Read rows via `table.getRowModel()`
 * — memoized per revision, so snapshot reads stay Object.is-stable.
 *
 * Controlled slices: pass `state` + `atoms` (external `@tanstack/store`
 * atoms own the slice) or subscribe `table.atoms.<slice>` yourself.
 */
export function useTable<TData extends RowData, TFeatures extends TableFeatures = DataGridFeatures>(
	options: DataGridOptions<TFeatures, TData>,
): UseTable<TFeatures, TData> {
	const [{ table }] = useState(() => ({ table: createTable<TData, TFeatures>(options) }))
	table.setOptions((prev) => ({ ...prev, ...options }) as never)
	const subscribe = useCallback(
		(notify: () => void) => {
			const sub = table.store.subscribe(() => notify())
			return () => sub.unsubscribe()
		},
		[table],
	)

	const state = useSyncExternalStore(subscribe, () => table.store.get())
	return { table, state }
}
