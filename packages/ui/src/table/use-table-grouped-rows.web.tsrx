// Grouped-rows plugin — port of upstream
// plugins/groupedRows/useTableGroupedRows.tsx (Astryx 0.6.4, MIT), web leaf.
// Synthetic Symbol-marked Proxy header rows (field reads → '') flatten into
// the data; transformBodyRow replaces a header row's cells with one
// full-width <td> carrying a sticky inner label + chevron toggle.

import { useMemo, useRef } from 'octane'
import type { TablePlugin, UseTableGroupedRowsConfig, UseTableGroupedRowsResult } from './types'
import { flattenGroups, isGroupHeader, makeGroupedIdKey } from './grouped-rows'
import { Icon } from '../Icon'

/**
 * Groups a flat data array into collapsible section rows. Each distinct
 * `groupBy` value becomes a full-width section-header row with a chevron
 * toggle, the group label, and a member count; collapsing hides that group's
 * data rows while keeping the header visible.
 *
 * The consumer owns `collapsedGroups`; pass the returned `{plugin, data,
 * idKey}` to `<Table>` (see upstream docs in grouped-rows.ts).
 */
export function useTableGroupedRows<T extends Record<string, unknown>>(
	config: UseTableGroupedRowsConfig<T>,
): UseTableGroupedRowsResult<T> {
	const configRef = useRef(config)
	configRef.current = config
	const { data, groupBy, collapsedGroups, groupOrder } = config

	const flattened = useMemo(
		() => flattenGroups(data, groupBy, collapsedGroups, groupOrder),
		[data, groupBy, collapsedGroups, groupOrder],
	)

	const idKey = useMemo(
		() => makeGroupedIdKey(flattened, config.getRowKey),
		[flattened, config.getRowKey],
	)

	const plugin = useMemo(
		(): TablePlugin<T> => ({
			// A header row is not one of the caller's rows, so running a cell
			// renderer against it can only misread it or throw — and the cells
			// are discarded by transformBodyRow regardless.
			transformBodyCell(props, _column, item) {
				if (!isGroupHeader(item)) {
					return props
				}

				return { ...props, isContentSuppressed: true }
			},
			// Replace a header row's pre-rendered cells with one full-width cell.
			transformBodyRow(props, item) {
				if (!isGroupHeader(item)) {
					return props
				}

				const { collapsedGroups: collapsed, onToggleGroup, renderGroupHeader } = configRef.current
				const isCollapsed = collapsed.has(item.groupKey)
				const toggle = () => onToggleGroup(item.groupKey)
				const content = renderGroupHeader ? (
					renderGroupHeader(item.groupKey, item.count, isCollapsed)
				) : (
					<span class="vx-table-group-label">
						{item.groupKey} <span class="vx-table-group-count">({item.count})</span>
					</span>
				)

				return {
					...props,
					htmlProps: {
						...props.htmlProps,
						// Convenience: clicking anywhere on the row toggles it. The
						// chevron button below is the accessible, keyboard-operable
						// control, so the row keeps its implicit row role.
						onClick: toggle,
						'aria-expanded': !isCollapsed,
					},
					classes: [...props.classes, 'vx-table-row--group-header'],
					children: (
						// colSpan larger than the column count is clamped to the actual
						// number of columns, so the header always spans the full width
						// without the plugin knowing the column count.
						<td colSpan={999} class="vx-table-cell vx-table-group-header-cell">
							<span
								class={
									renderGroupHeader
										? 'vx-table-group-header-inner'
										: 'vx-table-group-header-inner vx-table-group-header-inner--fit'
								}
							>
								{/* Standalone chevron button, flush with the table's start
									edge — the keyboard control. */}
								<button
									type="button"
									class="vx-table-chevron"
									onClick={(e: any) => {
										e.stopPropagation()
										toggle()
									}}
									aria-label={
										isCollapsed
											? `Expand group ${item.groupKey}`
											: `Collapse group ${item.groupKey}`
									}
									aria-expanded={!isCollapsed}
								>
									<span
										class={
											isCollapsed
												? 'vx-table-chevron-icon vx-table-chevron-icon--collapsed'
												: 'vx-table-chevron-icon vx-table-chevron-icon--expanded'
										}
									>
										<Icon name="xplat-chevron-right" size={12} />
									</span>
								</button>
								{content as any}
							</span>
						</td>
					) as any,
				}
			},
		}),
		[flattened],
	)

	return { plugin, data: flattened, idKey }
}

export type { UseTableGroupedRowsConfig, UseTableGroupedRowsResult }
