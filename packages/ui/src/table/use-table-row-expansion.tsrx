/** @jsxImportSource @nativescript-community/octane */
// Row-expansion plugin — universal leaf. Same contract as the web leaf; the
// chevron is a tappable view and the detail panel is a full-width masonview
// composed into `afterRow` (pointer context menus don't exist on native —
// the data effects still apply).

import { useRef } from 'octane'
import type { TablePlugin, BodyRowRenderProps, UseTableRowExpansionConfig } from './types'
import type { TableColumn } from '../props'
import { pixel } from './column-utils'
import { Icon } from '../Icon'
import { TableSlot, tableSlot } from './table-slot'

const EXPANSION_COLUMN_WIDTH = pixel(40)

function ExpansionCell<T extends Record<string, unknown>>(props: {
	item: T
	configRef: { current: UseTableRowExpansionConfig<T> }
}) @{
	const cfg = props.configRef.current
	const expandable = cfg.getIsItemExpandable ? cfg.getIsItemExpandable(props.item) : true
	if (!expandable) {
		return null as any
	}

	const key = cfg.getRowKey(props.item)
	const isExpanded = cfg.expandedKeys.has(key)
	<masonview
		className={isExpanded ? 'vx-table-expander vx-table-expander--expanded' : 'vx-table-expander'}
		onTap={() => cfg.onToggle(key)}
		accessibilityLabel={isExpanded ? 'Collapse row' : 'Expand row'}
		style={{ width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}
	>
		<Icon name="xplat-chevron-right" size={12} />
	</masonview>
}

function ExpandedPanel<T extends Record<string, unknown>>(props: {
	item: T
	rowKey: string
	prior: any
	configRef: { current: UseTableRowExpansionConfig<T> }
}) @{
	const panel = (
		<masonview
			key={`${props.rowKey}-expanded`}
			className="vx-table-expanded-row"
			style={{ padding: 16, backgroundColor: 'rgba(0,0,0,0.03)' }}
		>
			<TableSlot value={props.configRef.current.renderExpanded(props.item)} />
		</masonview>
	)

	if (props.prior == null) {
		return panel
	}
	<>
		<TableSlot value={props.prior} />
		{panel}
	</>
}

/**
 * Returns a TablePlugin that expands a full-width detail panel below a row —
 * see the web leaf for the full contract.
 */
export function useTableRowExpansion<T extends Record<string, unknown>>(
	config: UseTableRowExpansionConfig<T>,
): TablePlugin<T> {
	const configRef = useRef(config)
	configRef.current = config

	const expansionColumn: TableColumn<T> = {
		key: '__expansion',
		header: 'Row expansion',
		width: EXPANSION_COLUMN_WIDTH,
		resizable: false,
		renderCell: (item: T) => tableSlot(ExpansionCell, { item, configRef }),
	}

	return {
		transformColumns(columns: TableColumn<T>[]) {
			return [expansionColumn, ...columns]
		},

		transformBodyRow(props: BodyRowRenderProps, item: T): BodyRowRenderProps {
			const cfg = configRef.current
			const expandable = cfg.getIsItemExpandable ? cfg.getIsItemExpandable(item) : true
			if (!expandable) {
				return props
			}

			const key = cfg.getRowKey(item)
			if (!cfg.expandedKeys.has(key)) {
				return props
			}

			return {
				...props,
				afterRow: tableSlot(ExpandedPanel, {
					item,
					rowKey: key,
					prior: props.afterRow ?? null,
					configRef,
				}),
			}
		},
	}
}

export type { UseTableRowExpansionConfig }
