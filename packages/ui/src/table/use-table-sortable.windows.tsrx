/** @jsxImportSource @octane-xplat/jsx */
// Windows input prerequisite: preserve the shared header drawing and use the
// measured Pressable peer for activation. Full Table semantics stay separate.

import { useRef } from 'octane'
import type {
	TablePlugin,
	HeaderCellRenderProps,
	TableSortDirection,
	TableSortState,
	UseTableSortableConfig,
} from './types'

import type { TableColumn } from '../props'
import { Icon } from '../components/media/Icon.tsrx'
import { Pressable } from '../components/actions/Pressable.tsrx'
import { TextSlot } from '../components/forms/text-slot.tsrx'
import { TableSlot, tableSlot } from './table-slot.tsrx'

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
	sort: TableSortState
	isMultiSortEnabled?: boolean
	configRef: { current: UseTableSortableConfig }
}) @{
	const sort = props.sort
	const sortKey = resolveSortKey(props.column) ?? ''
	const entryIndex = sort.findIndex((e) => e.sortKey === sortKey)
	const direction = entryIndex >= 0 ? sort[entryIndex]!.direction : null
	const label = typeof props.column.header === 'string' ? props.column.header : props.column.key
	const rank =
		props.isMultiSortEnabled && sort.length > 1 && entryIndex >= 0 ? entryIndex + 1 : null

	const name =
		direction == null
			? `Sort by ${label}`
			: rank != null
				? `Sorted by ${label} ${direction} (priority ${rank} of ${sort.length})`
				: `Sorted by ${label} ${direction}`

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

	<Pressable
		className="vx-table-sort-button"
		accessibilityLabel={name}
		onPress={handlePress}
		style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}
	>
		{typeof props.children === 'string' || typeof props.children === 'number' ? (
			<TextSlot>{props.children}</TextSlot>
		) : (
			<TableSlot value={props.children} />
		)}
		<Icon name={iconName} size={12} />
	</Pressable>
}

/** Windows sortable header input candidate. Uses the same controlled sort
 * cycle as the native default; OS input and Table structure need qualification. */
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
				content: tableSlot(SortHeaderButton, {
					column,
					configRef,
					// Ref mutation alone does not rerender an unchanged-prop native child.
					sort: configRef.current.sort,
					isMultiSortEnabled: configRef.current.isMultiSortEnabled,
					children: props.content,
				}),
			}
		},
	}
}

export type { UseTableSortableConfig }
