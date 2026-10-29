import { useMemo, useRef } from 'octane'
import type { TablePlugin } from './types'
import type { UseTableColumnResizeConfig } from './use-table-column-resize.tsrx'
import { createAppKitColumnResizePlugin } from './column-resize-plan.macos'

export type { UseTableColumnResizeConfig } from './use-table-column-resize.tsrx'

/** Controlled widths update the whole native plan. No native resize handles. */
export function useTableColumnResize<T extends Record<string, unknown>>(
	config: UseTableColumnResizeConfig,
): TablePlugin<T> {
	const current = useRef(config); current.current = config
	return useMemo(() => createAppKitColumnResizePlugin<T>(() => current.current), [])
}
