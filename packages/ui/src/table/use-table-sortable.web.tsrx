// Sortable plugin — port of upstream plugins/sortable/useTableSortable
// (Astryx 0.6.4, MIT), web leaf. Header sort control is a real <button>;
// sort actions also land in the header context menu.

import { useRef } from 'octane'
import type { TablePlugin, HeaderCellRenderProps, TableContextAction, TableSortState, TableSortDirection, UseTableSortableConfig } from './types'
import type { TableColumn } from '../props'
import { Icon } from '../Icon'

export function resolveSortKey<T extends Record<string, unknown>>(column: TableColumn<T>): string | null {
	const { sortable } = column
	if (!sortable) return null
	if (sortable === true) return column.key
	return sortable.sortKey ?? column.key
}

function getHeaderLabel<T extends Record<string, unknown>>(column: TableColumn<T>): string {
	return typeof column.header === 'string' ? column.header : column.key
}

function getNextDirection(current: TableSortDirection | null, allowUnsortedState: boolean): TableSortDirection | null {
	if (current == null) return 'ascending'
	if (current === 'ascending') return 'descending'
	return allowUnsortedState ? null : 'ascending'
}

function SortHeaderButton<T extends Record<string, unknown>>(props: {
	column: TableColumn<T>
	children: any
	configRef: { current: UseTableSortableConfig }
}) @{
	const config = props.configRef.current
	const column = props.column
	const sortKey = resolveSortKey(column) ?? ''
	const entryIndex = config.sort.findIndex((e) => e.sortKey === sortKey)
	const entry = entryIndex >= 0 ? config.sort[entryIndex] : null
	const direction = entry?.direction ?? null
	const isMultiSort = config.isMultiSortEnabled === true && config.sort.length > 1
	const rank = isMultiSort && entryIndex >= 0 ? entryIndex + 1 : null
	const iconName = direction === 'ascending' ? 'xplat-arrow-up' : direction === 'descending' ? 'xplat-arrow-down' : 'xplat-arrows-up-down'
	const label = getHeaderLabel(column)
	const ariaLabel =
		direction == null
			? `Sort by ${label}`
			: rank != null
				? `Sorted by ${label} ${direction} (priority ${rank} of ${config.sort.length})`
				: `Sorted by ${label} ${direction}`

	const handleClick = (e: any) => {
		const cfg = props.configRef.current
		const isShift = e?.shiftKey && cfg.isMultiSortEnabled
		const allowUnsorted = cfg.allowUnsortedState ?? true
		if (isShift) {
			const idx = cfg.sort.findIndex((s) => s.sortKey === sortKey)
			if (idx >= 0) {
				const nextDir = getNextDirection(cfg.sort[idx]!.direction, allowUnsorted)
				if (nextDir == null) {
					const next = [...cfg.sort]
					next.splice(idx, 1)
					cfg.onSortChange(next)
				} else {
					const next = [...cfg.sort]
					next[idx] = { ...next[idx]!, direction: nextDir }
					cfg.onSortChange(next)
				}
			} else {
				cfg.onSortChange([...cfg.sort, { sortKey, direction: 'ascending' }])
			}
		} else {
			const currentEntry = cfg.sort.find((s) => s.sortKey === sortKey)
			const nextDir = getNextDirection(currentEntry?.direction ?? null, allowUnsorted)
			if (nextDir == null) cfg.onSortChange([])
			else cfg.onSortChange([{ sortKey, direction: nextDir }])
		}
	}

	<button
		type="button"
		class={cxSort(column.align, direction)}
		aria-label={ariaLabel}
		onClick={handleClick}>
		<span class="vx-table-sort-label">{props.children}</span>
		<span class={direction != null ? 'vx-table-sort-icon vx-table-sort-icon--active' : 'vx-table-sort-icon'}>
			<Icon name={iconName} size={12} />
		</span>
		{rank != null && <span class="vx-table-sort-rank" aria-hidden="true">{rank}</span>}
	</button>
}

function cxSort(align: string | undefined, direction: TableSortDirection | null) {
	return [
		'vx-table-sort-button',
		align === 'end' && 'vx-table-sort-button--end',
		align === 'center' && 'vx-table-sort-button--center',
		direction != null && 'vx-table-sort-button--active',
	].filter(Boolean).join(' ')
}

/** Sortable plugin — wraps sortable header content in a sort button and
 *  contributes sort context-menu actions. */
export function useTableSortable<T extends Record<string, unknown>, TSortKey extends string = string>(
	config: UseTableSortableConfig<TSortKey>,
): TablePlugin<T> {
	const configRef = useRef(config)
	configRef.current = config

	return {
		transformHeaderCell(props: HeaderCellRenderProps, column: TableColumn<T>): HeaderCellRenderProps {
			const sortKey = resolveSortKey(column)
			if (sortKey == null) return props
			const entry = configRef.current.sort.find((e) => e.sortKey === sortKey)

			const getSortActions = (): TableContextAction[] => {
				const c = configRef.current
				const dir = c.sort.find((e) => e.sortKey === sortKey)?.direction ?? null
				const actions: TableContextAction[] = [
					{
						id: 'sort-asc',
						group: 'sort',
						label: 'Sort ascending',
						checked: dir === 'ascending',
						onSelect: () => c.onSortChange([{ sortKey: sortKey as TSortKey, direction: 'ascending' }]),
					},
					{
						id: 'sort-desc',
						group: 'sort',
						label: 'Sort descending',
						checked: dir === 'descending',
						onSelect: () => c.onSortChange([{ sortKey: sortKey as TSortKey, direction: 'descending' }]),
					},
				]
				if (dir != null) {
					actions.push({
						id: 'sort-clear',
						group: 'sort-clear',
						label: 'Clear sort',
						onSelect: () => c.onSortChange(c.sort.filter((e) => e.sortKey !== sortKey)),
					})
				}
				return actions
			}

			const prior = props.contextMenuActions
			return {
				...props,
				htmlProps: {
					...props.htmlProps,
					...(entry != null ? { 'aria-sort': entry.direction } : {}),
				},
				content: (
					<SortHeaderButton column={column} configRef={configRef as any}>
						{props.content}
					</SortHeaderButton>
				),
				contextMenuActions: () => [
					...(typeof prior === 'function' ? prior() : (prior ?? [])),
					...getSortActions(),
				],
			}
		},
	}
}
export type { UseTableSortableConfig }
