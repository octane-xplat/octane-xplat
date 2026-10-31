/** @jsxImportSource @octane-xplat/jsx */
// Column resize plugin — universal leaf. The drag/keyboard separator is
// web-only (pointer capture + separator semantics); native applies the same
// controlled `columnWidths` overrides to header cells and exposes the same
// config, so consumers compose identically.

import { useRef } from 'octane'
import type { TablePlugin, HeaderCellRenderProps } from './types'
import type { TableColumn } from '../props'

/** Config for useTableColumnResize — controlled widths plus drag bounds. */
export interface UseTableColumnResizeConfig {
	/** Controlled per-column-key pixel widths — overrides content sizing. */
	columnWidths?: Record<string, number>
	/** Committed widths after a drag/keyboard resize ends. */
	onColumnResizeEnd?: (columnWidths: Record<string, number>) => void
	/** Smallest width a column can be dragged to, in px. */
	minWidth?: number
	/** Largest width a column can be dragged to, in px. */
	maxWidth?: number
	/** Column descriptors — supplies keys and initial widths. */
	columns?: ReadonlyArray<TableColumn<any>>
}

/** Column resize plugin — applies controlled width overrides; the
 *  interactive separator is available on the web leaf only. */
export function useTableColumnResize<T extends Record<string, unknown>>(
	config: UseTableColumnResizeConfig,
): TablePlugin<T> {
	const configRef = useRef(config)
	configRef.current = config

	return {
		transformHeaderCell(props: HeaderCellRenderProps, column: TableColumn<T>) {
			const override = configRef.current.columnWidths?.[column.key]
			if (override == null) {
				return props
			}

			return {
				...props,
				htmlProps: {
					...props.htmlProps,
					style: { ...props.htmlProps.style, width: `${override}px`, minWidth: `${override}px` },
				},
			}
		},
	}
}
