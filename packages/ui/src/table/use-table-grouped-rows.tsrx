/** @jsxImportSource @nativescript-community/octane */
// Grouped-rows plugin — universal leaf. Same contract as the web leaf; the
// full-width header cell is a masonview row and the chevron is a tappable
// view (row-level toggles ride the leaf's onClick → onTap mapping).

import { useMemo, useRef } from 'octane'
import type { TablePlugin, UseTableGroupedRowsConfig, UseTableGroupedRowsResult } from './types'
import { flattenGroups, isGroupHeader, makeGroupedIdKey } from './grouped-rows'
import { Icon } from '../Icon'

/**
 * Groups a flat data array into collapsible section rows — see the web leaf
 * for the full contract.
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
			transformBodyCell(props, _column, item) {
				if (!isGroupHeader(item)) {
					return props
				}

				return { ...props, isContentSuppressed: true }
			},
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
					<masonview className="vx-table-group-label" style={{ flexDirection: 'row' }}>
						<label text={`${item.groupKey} (${item.count})`} />
					</masonview>
				)

				return {
					...props,
					htmlProps: {
						...props.htmlProps,
						onClick: toggle,
						'aria-expanded': !isCollapsed,
					},
					classes: [...props.classes, 'vx-table-row--group-header'],
					children: (
						<masonview
							className="vx-table-group-header-cell"
							style={{ flexGrow: 1, flexDirection: 'row', alignItems: 'center' }}
						>
							<masonview
								className="vx-table-chevron"
								onTap={toggle}
								style={{ width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}
							>
								<Icon name="xplat-chevron-right" size={12} />
							</masonview>
							{content}
						</masonview>
					) as any,
				}
			},
		}),
		[flattened],
	)

	return { plugin, data: flattened, idKey }
}

export type { UseTableGroupedRowsConfig, UseTableGroupedRowsResult }
