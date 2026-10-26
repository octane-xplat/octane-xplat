// Column resize plugin — universal leaf. The drag/keyboard separator is
// web-only (pointer capture + separator semantics); native applies the same
// controlled `columnWidths` overrides to header cells and exposes the same
// config, so consumers compose identically.

import { useRef } from 'octane'
import type { TablePlugin, HeaderCellRenderProps } from './types'
import type { TableColumn } from '../props'

export interface UseTableColumnResizeConfig {
	columnWidths?: Record<string, number>
	onColumnResizeEnd?: (columnWidths: Record<string, number>) => void
	minWidth?: number
	maxWidth?: number
	columns?: ReadonlyArray<TableColumn<any>>
}

/** Column resize plugin — applies controlled width overrides; the
 *  interactive separator is available on the web leaf only. */
export function useTableColumnResize<T extends Record<string, unknown>>(config: UseTableColumnResizeConfig): TablePlugin<T> {
	const configRef = useRef(config)
	configRef.current = config

	return {
		transformHeaderCell(props: HeaderCellRenderProps, column: TableColumn<T>) {
			const override = configRef.current.columnWidths?.[column.key]
			if (override == null) return props
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
