/** @jsxImportSource @octane-xplat/jsx */
import { useEffect, useMemo, useRef, useState } from 'octane'
import type { TablePlugin } from './types'
import type { UseTableColumnResizeConfig } from './use-table-column-resize.tsrx'
import { createAppKitColumnResizePlugin } from './column-resize-plan.macos'
import { createAppKitColumnResizeState } from './column-resize-state.macos'
import { AppKitColumnResizeHandle } from './column-resize-handle.macos.tsrx'
import { useDirection } from '../internationalization'
import { mergeStyle } from '../style-merge'
import { TableSlot } from './table-slot'
export type { UseTableColumnResizeConfig } from './use-table-column-resize.tsrx'

/** Native preview/commit ownership plus shared column-plan sizing. */
export function useTableColumnResize<T extends Record<string, unknown>>(config: UseTableColumnResizeConfig): TablePlugin<T> {
	const direction = useDirection(), current = useRef({ config, direction }); current.current = { config, direction }
	const [, render] = useState(0)
	const state = useMemo(() => createAppKitColumnResizeState({ config: () => current.current.config, changed: () => render((n) => n + 1) }), [])
	const plan = useMemo(() => createAppKitColumnResizePlugin<T>(() => ({ ...current.current.config, columnWidths: state.widths() })), [])
	useEffect(() => () => state.dispose(), [])
	return {
		...plan,
		transformHeaderCell(props, column) {
			if (column.resizable === false) return props
			const width = column.width?.type === 'pixel' ? column.width.value : column.width?.minWidth ?? 120
			return { ...props, htmlProps: { ...props.htmlProps, style: mergeStyle(props.htmlProps.style, { position: 'relative' }) },
				overlay: <><TableSlot value={props.overlay} /><AppKitColumnResizeHandle columnKey={column.key} label={typeof column.header === 'string' ? column.header : column.key} width={width} direction={current.current.direction} state={state} /></> }
		},
	}
}
