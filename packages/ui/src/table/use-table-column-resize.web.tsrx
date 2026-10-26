// Column resize plugin — port of upstream plugins/columnResize
// (Astryx 0.6.4, MIT), web leaf. Pointer-drag + keyboard separator with
// min/max clamps and proportional-column neighbor compensation; width
// overrides apply to header cells in px.

import { useRef, useState } from 'octane'
import type { TablePlugin, HeaderCellRenderProps, ScrollWrapperRenderProps } from './types'
import type { TableColumn } from '../props'

export interface UseTableColumnResizeConfig {
	/** Controlled map of column width overrides in px. */
	columnWidths?: Record<string, number>
	onColumnResizeEnd?: (columnWidths: Record<string, number>) => void
	minWidth?: number
	maxWidth?: number
	/** Columns array — used to read neighbors during a drag. */
	columns?: ReadonlyArray<TableColumn<any>>
}

interface DragState {
	key: string
	startX: number
	startWidth: number
	currentWidth: number
	neighborKey?: string
	neighborStartWidth?: number
	neighborWidth?: number
}

function ResizeHandle(props: {
	columnKey: string
	configRef: { current: { drag: DragState | null; setWidth: (k: string, v: number) => void; commit: () => void; cfg: UseTableColumnResizeConfig } }
}) @{
	const [isResizing, setIsResizing] = useState(false)

	const begin = (startX: number, el: HTMLElement | null) => {
		const st = props.configRef.current
		const th = el?.closest('th') ?? el?.parentElement
		const startWidth = th?.offsetWidth ?? 0
		st.drag = { key: props.columnKey, startX, startWidth, currentWidth: startWidth }
		setIsResizing(true)
	}

	const move = (clientX: number) => {
		const st = props.configRef.current
		const drag = st.drag
		if (!drag || drag.key !== props.columnKey) return
		const delta = clientX - drag.startX
		const min = st.cfg.minWidth ?? 50
		const max = st.cfg.maxWidth
		let next = Math.max(min, drag.startWidth + delta)
		if (max != null) next = Math.min(max, next)
		drag.currentWidth = next
		st.setWidth(props.columnKey, next)
	}

	const end = () => {
		const st = props.configRef.current
		if (!st.drag) return
		st.commit()
		st.drag = null
		setIsResizing(false)
	}

	const onPointerDown = (e: PointerEvent) => {
		e.preventDefault()
		e.stopPropagation()
		const handle = e.currentTarget as HTMLElement
		begin(e.clientX, handle)
		const onMove = (ev: PointerEvent) => move(ev.clientX)
		const onUp = () => {
			globalThis.removeEventListener('pointermove', onMove)
			globalThis.removeEventListener('pointerup', onUp)
			end()
		}
		globalThis.addEventListener('pointermove', onMove)
		globalThis.addEventListener('pointerup', onUp)
	}

	const onKeyDown = (e: KeyboardEvent) => {
		const st = props.configRef.current
		const th = (e.currentTarget as HTMLElement).closest('th')
		const current = st.drag?.currentWidth ?? th?.offsetWidth ?? 0
		const min = st.cfg.minWidth ?? 50
		const max = st.cfg.maxWidth ?? Infinity
		let next: number | null = null
		if (e.key === 'ArrowLeft') next = Math.max(min, current - 10)
		else if (e.key === 'ArrowRight') next = Math.min(max, current + 10)
		else if (e.key === 'Home') next = min
		else if (e.key === 'End') next = max === Infinity ? current : max
		else if (e.key === 'Escape') { st.drag = null; setIsResizing(false); return }
		if (next != null) {
			e.preventDefault()
			e.stopPropagation()
			st.setWidth(props.columnKey, Math.round(next))
			st.commit()
		}
	}

	<div
		role="separator"
		tabIndex={0}
		aria-label="Resize column"
		aria-orientation="vertical"
		class={isResizing ? 'vx-table-resize-handle vx-table-resize-handle--active' : 'vx-table-resize-handle'}
		onPointerDown={onPointerDown}
		onKeyDown={onKeyDown}
	/>
}

/** Column resize plugin — separator handles in header cells + controlled
 *  width overrides applied to header/body columns. */
export function useTableColumnResize<T extends Record<string, unknown>>(config: UseTableColumnResizeConfig): TablePlugin<T> {
	const [localWidths, setLocalWidths] = useState<Record<string, number>>({})
	const state = {
		current: {
			drag: null as DragState | null,
			setWidth: (k: string, v: number) => setLocalWidths((prev: Record<string, number>) => ({ ...prev, [k]: v })),
			commit: () => configRef.current.onColumnResizeEnd?.({ ...widthsRef.current }),
			cfg: config,
		},
	}
	const configRef = useRef(config)
	configRef.current = config
	const widthsRef = useRef<Record<string, number>>({})
	widthsRef.current = { ...(config.columnWidths ?? {}), ...localWidths }
	const widths = widthsRef.current

	return {
		transformHeaderCell(props: HeaderCellRenderProps, column: TableColumn<T>) {
			const override = widths[column.key]
			const htmlProps = { ...props.htmlProps }
			const isLocked = column.resizable === false
			const showHandle = !isLocked || override != null
			if (showHandle) {
				htmlProps.style = { ...htmlProps.style, position: 'relative' }
			}
			if (override != null) {
				htmlProps.style = { ...htmlProps.style, width: `${override}px`, minWidth: `${override}px` }
			}
			const activeHandle = state.current.drag?.key === column.key
			return {
				...props,
				htmlProps,
				classes: [...props.classes, showHandle && 'vx-table-header-cell--resizable', activeHandle && 'vx-table-header-cell--resizing'],
				overlay: (
					<>
						{props.overlay as any}
						{!isLocked && <ResizeHandle columnKey={column.key} configRef={state} />}
					</>
				),
			}
		},
		transformScrollWrapper(props: ScrollWrapperRenderProps) {
			return {
				...props,
				htmlProps: { ...props.htmlProps, 'data-table-resize': 'true' },
			}
		},
	}
}
