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

const EXPANSION_COLUMN_WIDTH = pixel(40)

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
		renderCell: (item: T) => {
			const cfg = configRef.current
			const expandable = cfg.getIsItemExpandable ? cfg.getIsItemExpandable(item) : true
			if (!expandable) {
				return null
			}

			const key = cfg.getRowKey(item)
			const isExpanded = cfg.expandedKeys.has(key)
			return (
				<masonview
					className={
						isExpanded ? 'vx-table-expander vx-table-expander--expanded' : 'vx-table-expander'
					}
					onTap={() => cfg.onToggle(key)}
					accessibilityLabel={isExpanded ? 'Collapse row' : 'Expand row'}
					style={{ width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}
				>
					<Icon name="xplat-chevron-right" size={12} />
				</masonview>
			)
		},
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

			const panel = (
				<masonview
					key={`${key}-expanded`}
					className="vx-table-expanded-row"
					style={{ padding: 16, backgroundColor: 'rgba(0,0,0,0.03)' }}
				>
					{cfg.renderExpanded(item)}
				</masonview>
			)

			return {
				...props,
				afterRow: props.afterRow ? (
					<>
						{props.afterRow}
						{panel}
					</>
				) : (
					panel
				),
			}
		},
	}
}

export type { UseTableRowExpansionConfig }
