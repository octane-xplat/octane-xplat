// Row-expansion plugin — port of upstream
// plugins/rowExpansion/useTableRowExpansion.tsx (Astryx 0.6.4, MIT), web
// leaf. Leading chevron column, a lazy "Expand/Collapse row" context-menu
// action per cell, and a full-width detail panel composed into `afterRow`.
// For hierarchical data (child rows reusing the parent columns) use
// useTableTreeData + useTableTreeState instead.

import { useRef } from 'octane'
import type {
	TablePlugin,
	BodyRowRenderProps,
	BodyCellRenderProps,
	TableContextActions,
	UseTableRowExpansionConfig,
} from './types'

import type { TableColumn } from '../props'
import { pixel } from './column-utils'
import { Icon } from '../Icon'
import { VisuallyHidden } from '../VisuallyHidden'

const EXPANSION_COLUMN_WIDTH = pixel(40)

function resolveActions(actions: TableContextActions | undefined) {
	if (!actions) {
		return []
	}

	return typeof actions === 'function' ? actions() : actions
}

function ExpansionChevron(props: { isExpanded: boolean; onToggle: () => void }) @{
	<button
		type="button"
		class="vx-table-expander"
		onClick={(e: any) => {
			e.stopPropagation()
			props.onToggle()
		}}
		aria-label={props.isExpanded ? 'Collapse row' : 'Expand row'}
		aria-expanded={props.isExpanded}
	>
		<span
			class={
				props.isExpanded
					? 'vx-table-chevron-icon vx-table-chevron-icon--expanded'
					: 'vx-table-chevron-icon vx-table-chevron-icon--collapsed'
			}
		>
			<Icon name="xplat-chevron-right" size={12} />
		</span>
	</button>
}

/**
 * Returns a TablePlugin that expands a full-width detail panel below a row.
 * The consumer owns the `expandedKeys` set; the plugin adds the leading
 * chevron column, the context-menu action, and the `renderExpanded` panel.
 */
export function useTableRowExpansion<T extends Record<string, unknown>>(
	config: UseTableRowExpansionConfig<T>,
): TablePlugin<T> {
	const configRef = useRef(config)
	configRef.current = config

	// Final rendered column count, captured in transformColumns (pipeline step
	// 1) and read in transformBodyRow for the detail panel's colSpan.
	const columnCountRef = useRef(1)

	const expansionColumn: TableColumn<T> = {
		key: '__expansion',
		// A <th> with no discernible text is announced as an unlabelled column;
		// the label is hidden because the column shows only chevrons.
		header: <VisuallyHidden>Row expansion</VisuallyHidden>,
		width: EXPANSION_COLUMN_WIDTH,
		resizable: false,
		renderCell: (item: T) => {
			const cfg = configRef.current
			const expandable = cfg.getIsItemExpandable ? cfg.getIsItemExpandable(item) : true
			if (!expandable) {
				return null
			}

			const key = cfg.getRowKey(item)
			return (
				<ExpansionChevron
					isExpanded={cfg.expandedKeys.has(key)}
					onToggle={() => cfg.onToggle(key)}
				/>
			)
		},
	}

	return {
		transformColumns(columns: TableColumn<T>[]) {
			const withExpansion = [expansionColumn, ...columns]
			columnCountRef.current = withExpansion.length
			return withExpansion
		},

		transformBodyCell(
			props: BodyCellRenderProps,
			_column: TableColumn<T>,
			item: T,
		): BodyCellRenderProps {
			const cfg = configRef.current
			const expandable = cfg.getIsItemExpandable ? cfg.getIsItemExpandable(item) : true
			if (!expandable) {
				return props
			}

			const key = cfg.getRowKey(item)
			const prior = props.contextMenuActions
			return {
				...props,
				// Lazy getter: the label reflects expansion state at menu-open time.
				contextMenuActions: () => {
					const isExpanded = configRef.current.expandedKeys.has(key)
					return [
						...resolveActions(prior),
						{
							id: 'row-expansion-toggle',
							group: 'row-expansion',
							label: isExpanded ? 'Collapse row' : 'Expand row',
							icon: (
								<Icon name={isExpanded ? 'xplat-chevron-down' : 'xplat-chevron-right'} size={12} />
							),
							onSelect: () => configRef.current.onToggle(key),
						},
					]
				},
			}
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
				<tr key={`${key}-expanded`} class="vx-table-expanded-row">
					<td colSpan={columnCountRef.current} class="vx-table-expanded-cell">
						{cfg.renderExpanded(item) as any}
					</td>
				</tr>
			)

			return {
				...props,
				afterRow: props.afterRow ? (
					<>
						{props.afterRow as any}
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
