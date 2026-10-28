/** @jsxImportSource @octane-xplat/jsx */
// Sortable plugin — universal leaf. Same contract as the web leaf; the
// header sort control is a pressable view + icon (no pointer context menu).

import { useRef } from 'octane'
import type {
	TablePlugin,
	HeaderCellRenderProps,
	TableSortState,
	TableSortDirection,
	UseTableSortableConfig,
} from './types'

import type { TableColumn } from '../props'
import { Icon } from '../Icon'
import { TableSlot, tableSlot } from './table-slot'

export function resolveSortKey<T extends Record<string, unknown>>(
	column: TableColumn<T>,
): string | null {
	const { sortable } = column
	if (!sortable) {
		return null
	}

	if (sortable === true) {
		return column.key
	}

	return sortable.sortKey ?? column.key
}

function getNextDirection(
	current: TableSortDirection | null,
	allowUnsortedState: boolean,
): TableSortDirection | null {
	if (current == null) {
		return 'ascending'
	}

	if (current === 'ascending') {
		return 'descending'
	}

	return allowUnsortedState ? null : 'ascending'
}

function SortHeaderButton<T extends Record<string, unknown>>(props: {
	column: TableColumn<T>
	children: any
	configRef: { current: UseTableSortableConfig }
}) @{
	const config = props.configRef.current
	const sortKey = resolveSortKey(props.column) ?? ''
	const entryIndex = config.sort.findIndex((e) => e.sortKey === sortKey)
	const direction = entryIndex >= 0 ? config.sort[entryIndex]!.direction : null
	const iconName =
		direction === 'ascending'
			? 'xplat-arrow-up'
			: direction === 'descending'
				? 'xplat-arrow-down'
				: 'xplat-arrows-up-down'

	const handlePress = () => {
		const cfg = props.configRef.current
		const allowUnsorted = cfg.allowUnsortedState ?? true
		const currentEntry = cfg.sort.find((s) => s.sortKey === sortKey)
		const nextDir = getNextDirection(currentEntry?.direction ?? null, allowUnsorted)
		if (nextDir == null) {
			cfg.onSortChange([])
		} else {
			cfg.onSortChange([{ sortKey, direction: nextDir }])
		}
	}

	<masonview
		className="vx-table-sort-button"
		onTap={handlePress}
		style={{ flexDirection: 'row', alignItems: 'center' }}
	>
		{typeof props.children === 'string' ? (
			<label text={props.children} />
		) : (
			<TableSlot value={props.children} />
		)}
		<Icon name={iconName} size={12} />
	</masonview>
}

/** Sortable plugin — wraps sortable header content in a tappable sort control. */
export function useTableSortable<
	T extends Record<string, unknown>,
	TSortKey extends string = string,
>(config: UseTableSortableConfig<TSortKey>): TablePlugin<T> {
	const configRef = useRef(config)
	configRef.current = config

	return {
		transformHeaderCell(
			props: HeaderCellRenderProps,
			column: TableColumn<T>,
		): HeaderCellRenderProps {
			const sortKey = resolveSortKey(column)
			if (sortKey == null) {
				return props
			}

			return {
				...props,
				content: tableSlot(SortHeaderButton, { column, configRef, children: props.content }),
			}
		},
	}
}

export type { UseTableSortableConfig }
